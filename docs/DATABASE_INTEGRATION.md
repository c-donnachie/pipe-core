# 🗄️ Integración con Base de Datos - PipeCore API

## 📖 Descripción

Este documento explica cómo integrar la base de datos para gestionar credenciales y configuraciones de proveedores por tenant, manteniendo las credenciales del `.env` como fallback.

## 🏗️ Arquitectura de datos

### Tabla: `tenant_providers`

```sql
CREATE TABLE tenant_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(255) NOT NULL,
  channel VARCHAR(50) NOT NULL, -- 'sms', 'whatsapp', 'email', 'push'
  provider VARCHAR(50) NOT NULL, -- 'twilio', 'meta', 'sendgrid', 'resend'
  credentials JSONB NOT NULL, -- Credenciales específicas del tenant
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, channel, provider)
);

-- Índices para optimizar consultas
CREATE INDEX idx_tenant_providers_tenant_id ON tenant_providers(tenant_id);
CREATE INDEX idx_tenant_providers_channel ON tenant_providers(channel);
CREATE INDEX idx_tenant_providers_active ON tenant_providers(is_active);
```

### Ejemplo de datos

```sql
-- Tenant TableFlow con Resend personalizado
INSERT INTO tenant_providers (tenant_id, channel, provider, credentials, is_active) VALUES
('tableflow_123', 'email', 'resend', 
 '{"apiKey": "re_tableflow_specific_key", "fromEmail": "noreply@tableflow.com"}', 
 true),

-- Tenant ROE con SendGrid personalizado
('roe_789', 'email', 'sendgrid', 
 '{"apiKey": "SG.roe_sendgrid_key", "fromEmail": "noreply@roe.com"}', 
 true),

-- Tenant Genda con Meta WhatsApp personalizado
('genda_456', 'whatsapp', 'meta', 
 '{"accessToken": "meta_genda_token", "phoneNumberId": "genda_phone_id", "verifyToken": "genda_verify"}', 
 true);
```

## 🔄 Flujo de resolución de credenciales

### 1. Prioridad de credenciales

```typescript
// Orden de prioridad:
// 1. Credenciales específicas del tenant (BD)
// 2. Credenciales por defecto del .env
// 3. Error si no hay credenciales
```

### 2. Implementación del MessageRouter

```typescript
// messageRouter.ts - Versión con base de datos
export class MessageRouter {
  constructor(
    private readonly dbService: DatabaseService, // ← Nueva dependencia
  ) {}

  /**
   * Obtiene configuración del proveedor con fallback a .env
   */
  async getProviderConfig(
    tenantId: string, 
    channel: 'whatsapp' | 'sms' | 'email' | 'push'
  ): Promise<ProviderConfig> {
    
    // 1. Intentar obtener de la base de datos
    const dbConfig = await this.getTenantProviderFromDB(tenantId, channel);
    if (dbConfig) {
      this.logger.log(`Usando credenciales de BD para tenant ${tenantId} en canal ${channel}`);
      return dbConfig;
    }

    // 2. Fallback a configuración por defecto (.env)
    this.logger.log(`Usando credenciales por defecto para tenant ${tenantId} en canal ${channel}`);
    return this.getDefaultProvider(channel);
  }

  /**
   * Obtiene configuración específica del tenant desde BD
   */
  private async getTenantProviderFromDB(
    tenantId: string, 
    channel: string
  ): Promise<ProviderConfig | null> {
    try {
      const query = `
        SELECT provider, credentials, is_active 
        FROM tenant_providers 
        WHERE tenant_id = $1 AND channel = $2 AND is_active = true
        ORDER BY updated_at DESC 
        LIMIT 1
      `;
      
      const result = await this.dbService.query(query, [tenantId, channel]);
      
      if (result.rows.length === 0) {
        return null; // No hay configuración específica
      }

      const row = result.rows[0];
      return {
        provider: row.provider,
        credentials: row.credentials,
        isActive: row.is_active,
      };
    } catch (error) {
      this.logger.error(`Error obteniendo configuración de BD para tenant ${tenantId}:`, error);
      return null; // Fallback a .env en caso de error
    }
  }

  /**
   * Configura un proveedor específico para un tenant
   */
  async setTenantProvider(
    tenantId: string,
    channel: 'whatsapp' | 'sms' | 'email' | 'push',
    provider: string,
    credentials: Record<string, any>,
    isActive: boolean = true
  ): Promise<void> {
    const query = `
      INSERT INTO tenant_providers (tenant_id, channel, provider, credentials, is_active)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (tenant_id, channel, provider) 
      DO UPDATE SET 
        credentials = EXCLUDED.credentials,
        is_active = EXCLUDED.is_active,
        updated_at = NOW()
    `;

    await this.dbService.query(query, [
      tenantId, 
      channel, 
      provider, 
      JSON.stringify(credentials), 
      isActive
    ]);

    this.logger.log(`Proveedor ${provider} configurado para tenant ${tenantId} en canal ${channel}`);
  }
}
```

## 🚀 Ejemplos de uso

### 1. Envío con credenciales automáticas

```typescript
// El sistema automáticamente usa:
// 1. Credenciales de BD si existen para el tenant
// 2. Credenciales del .env como fallback

await fetch('https://pipecore-api.com/messaging/send/email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tenant_id: 'tableflow_123', // ← Busca credenciales en BD primero
    to: 'cliente@email.com',
    subject: 'Confirmación de pedido',
    htmlContent: '<h1>¡Pedido confirmado!</h1>',
    from: 'noreply@tableflow.com'
  })
});
```

### 2. Configurar credenciales específicas por tenant

```typescript
// Configurar TableFlow para usar Resend personalizado
await fetch('https://pipecore-api.com/messaging/config/provider', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tenantId: 'tableflow_123',
    channel: 'email',
    provider: 'resend',
    credentials: {
      apiKey: 're_tableflow_specific_key', // ← Credencial específica
      fromEmail: 'noreply@tableflow.com'
    },
    isActive: true
  })
});

// Ahora TableFlow usará sus credenciales específicas
// Otros tenants seguirán usando las del .env
```

### 3. Migración gradual

```typescript
// Fase 1: Todos usan credenciales del .env
// (configuración actual)

// Fase 2: Migrar tenants uno por uno
await messageRouter.setTenantProvider('tableflow_123', 'email', 'resend', {
  apiKey: 're_tableflow_key',
  fromEmail: 'noreply@tableflow.com'
});

await messageRouter.setTenantProvider('roe_789', 'email', 'sendgrid', {
  apiKey: 'SG.roe_sendgrid_key',
  fromEmail: 'noreply@roe.com'
});

// Fase 3: Todos usan credenciales específicas
// (objetivo final)
```

## 🔧 Implementación paso a paso

### Paso 1: Crear el servicio de base de datos

```typescript
// database.service.ts
import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class DatabaseService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }

  async query(text: string, params?: any[]): Promise<any> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }
}
```

### Paso 2: Actualizar el MessageRouter

```typescript
// messageRouter.ts
import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service'; // ← Nueva dependencia

@Injectable()
export class MessageRouter {
  constructor(
    private readonly dbService: DatabaseService,
  ) {}

  // ... implementación con BD
}
```

### Paso 3: Actualizar el módulo

```typescript
// messaging.module.ts
import { Module } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Module({
  providers: [
    DatabaseService, // ← Agregar servicio de BD
    MessageRouter,
    // ... otros providers
  ],
  exports: [MessagingService],
})
export class MessagingModule {}
```

## 📊 Ventajas de esta arquitectura

### ✅ **Flexibilidad total**
- Cada tenant puede tener sus propias credenciales
- Migración gradual sin downtime
- Fallback automático a credenciales por defecto

### ✅ **Seguridad**
- Credenciales específicas por tenant
- No hay credenciales hardcodeadas
- Rotación de credenciales independiente

### ✅ **Escalabilidad**
- Fácil agregar nuevos tenants
- Configuración dinámica
- Sin cambios en código para nuevos tenants

### ✅ **Mantenibilidad**
- Una sola fuente de verdad
- Configuración centralizada
- Logs detallados de qué credenciales se usan

## 🚀 Próximos pasos

1. **Crear esquema de BD** - Implementar las tablas necesarias
2. **Servicio de BD** - Crear el servicio de base de datos
3. **Actualizar MessageRouter** - Integrar consultas a BD
4. **Migrar tenants** - Mover configuraciones a BD
5. **Dashboard de configuración** - Interfaz para gestionar credenciales
6. **Rotación automática** - Sistema para rotar credenciales
7. **Monitoreo** - Alertas cuando credenciales fallan
