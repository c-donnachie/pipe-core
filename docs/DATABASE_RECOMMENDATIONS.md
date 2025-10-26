# 🗄️ Recomendaciones de Base de Datos - PipeCore API

## 📖 Descripción

Este documento analiza las mejores opciones de base de datos para PipeCore API, considerando el uso específico de almacenar configuraciones de tenants, logs de mensajes y estadísticas.

## 🎯 **Casos de uso específicos de PipeCore**

### **Datos que almacenarás:**
1. **`tenant_providers`** - Configuraciones de proveedores por tenant (~100-1000 registros)
2. **`message_logs`** - Logs de todos los mensajes enviados (~millones de registros)
3. **`message_templates`** - Templates de mensajes (~100-10000 registros)
4. **`messaging_stats`** - Estadísticas agregadas (~millones de registros)

### **Patrones de acceso:**
- **Lectura frecuente** de configuraciones de tenants
- **Escritura masiva** de logs de mensajes
- **Consultas analíticas** en logs y estadísticas
- **Búsquedas por tenant_id** y rangos de fechas

## 🏆 **Recomendación: Supabase PostgreSQL**

### ✅ **Por qué Supabase es PERFECTO para PipeCore:**

#### **1. PostgreSQL nativo**
```sql
-- Funciona perfectamente con tu esquema actual
CREATE TABLE tenant_providers (
  tenant_id VARCHAR(255) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  api_key VARCHAR(500) NOT NULL,
  secret_key VARCHAR(500),
  from_email VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices optimizados para tus consultas
CREATE INDEX idx_tenant_providers_tenant_id ON tenant_providers(tenant_id);
CREATE INDEX idx_message_logs_tenant_date ON message_logs(tenant_id, created_at);
```

#### **2. Escalabilidad automática**
- **0-100 tenants**: Plan gratuito suficiente
- **100-1000 tenants**: Plan Pro ($25/mes)
- **1000+ tenants**: Plan Team ($599/mes)
- **Auto-scaling** sin configuración manual

#### **3. APIs nativas integradas**
```typescript
// Supabase genera automáticamente APIs REST y GraphQL
const { data: tenantConfig } = await supabase
  .from('tenant_providers')
  .select('*')
  .eq('tenant_id', 'tableflow_123')
  .eq('is_active', true);

// Real-time para logs (opcional)
supabase
  .channel('message_logs')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'message_logs' }, 
    (payload) => console.log('Nuevo log:', payload)
  )
  .subscribe();
```

#### **4. Funcionalidades específicas para PipeCore**

**Row Level Security (RLS):**
```sql
-- Cada tenant solo ve sus datos
CREATE POLICY "Tenants can only see their own data" ON tenant_providers
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id'));

-- Activar RLS
ALTER TABLE tenant_providers ENABLE ROW LEVEL SECURITY;
```

**Funciones personalizadas:**
```sql
-- Función para obtener estadísticas de un tenant
CREATE OR REPLACE FUNCTION get_tenant_stats(p_tenant_id VARCHAR)
RETURNS TABLE (
  total_messages BIGINT,
  successful_messages BIGINT,
  failed_messages BIGINT,
  last_7_days BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_messages,
    COUNT(*) FILTER (WHERE status = 'delivered') as successful_messages,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_messages,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as last_7_days
  FROM message_logs 
  WHERE tenant_id = p_tenant_id;
END;
$$ LANGUAGE plpgsql;
```

## 📊 **Comparación de opciones**

| Característica | Supabase | PlanetScale | MongoDB Atlas | AWS RDS |
|----------------|----------|-------------|---------------|---------|
| **PostgreSQL** | ✅ Nativo | ❌ MySQL | ❌ NoSQL | ✅ Nativo |
| **APIs automáticas** | ✅ REST/GraphQL | ✅ REST | ✅ REST | ❌ Manual |
| **Real-time** | ✅ Built-in | ❌ | ✅ Change Streams | ❌ |
| **RLS/Seguridad** | ✅ Avanzada | ⚠️ Básica | ⚠️ Básica | ⚠️ Manual |
| **Escalabilidad** | ✅ Auto | ✅ Auto | ✅ Auto | ⚠️ Manual |
| **Precio** | ✅ $0-25/mes | ✅ $0-29/mes | ⚠️ $9-57/mes | ⚠️ $15-100+/mes |
| **Setup time** | ✅ 5 min | ✅ 10 min | ✅ 10 min | ❌ 1+ hora |

## 🚀 **Implementación con Supabase**

### **1. Setup inicial (5 minutos)**

```bash
# 1. Crear proyecto en Supabase
# 2. Obtener URL y anon key
# 3. Instalar cliente
npm install @supabase/supabase-js
```

```typescript
// supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

### **2. Migración de datos existentes**

```sql
-- Supabase SQL Editor - Ejecutar una sola vez
CREATE TABLE tenant_providers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  channel VARCHAR(50) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  api_key VARCHAR(500) NOT NULL,
  secret_key VARCHAR(500),
  from_email VARCHAR(255),
  from_phone VARCHAR(50),
  webhook_url VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, channel, provider)
);

CREATE TABLE message_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  channel VARCHAR(50) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  to_address VARCHAR(500) NOT NULL,
  from_address VARCHAR(500),
  subject VARCHAR(500),
  body TEXT,
  status VARCHAR(50) NOT NULL, -- 'pending', 'sent', 'delivered', 'failed'
  provider_message_id VARCHAR(500),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimizar consultas
CREATE INDEX idx_tenant_providers_tenant_id ON tenant_providers(tenant_id);
CREATE INDEX idx_tenant_providers_active ON tenant_providers(is_active);
CREATE INDEX idx_message_logs_tenant_id ON message_logs(tenant_id);
CREATE INDEX idx_message_logs_created_at ON message_logs(created_at);
CREATE INDEX idx_message_logs_status ON message_logs(status);
CREATE INDEX idx_message_logs_tenant_created ON message_logs(tenant_id, created_at);
```

### **3. Actualizar MessageRouter**

```typescript
// messageRouter.ts - Versión con Supabase
import { supabase } from '../database/supabase';

export class MessageRouter {
  private readonly logger = new Logger(MessageRouter.name);

  /**
   * Obtiene configuración del proveedor desde Supabase
   */
  async getProviderConfig(
    tenantId: string, 
    channel: 'whatsapp' | 'sms' | 'email' | 'push'
  ): Promise<ProviderConfig> {
    
    // 1. Buscar en Supabase
    const { data: tenantConfig, error } = await supabase
      .from('tenant_providers')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('channel', channel)
      .eq('is_active', true)
      .single();

    if (tenantConfig && !error) {
      this.logger.log(`✅ Usando credenciales de Supabase para tenant ${tenantId} en canal ${channel}`);
      
      return {
        provider: tenantConfig.provider,
        credentials: {
          apiKey: tenantConfig.api_key,
          secretKey: tenantConfig.secret_key,
          fromEmail: tenantConfig.from_email,
          fromPhone: tenantConfig.from_phone,
          webhookUrl: tenantConfig.webhook_url,
        },
        isActive: tenantConfig.is_active,
      };
    }

    // 2. Fallback a configuración por defecto (.env)
    this.logger.log(`⚠️ Usando credenciales por defecto para tenant ${tenantId} en canal ${channel}`);
    return this.getDefaultProvider(channel);
  }

  /**
   * Configura un proveedor específico para un tenant
   */
  async setTenantProvider(
    tenantId: string,
    channel: 'whatsapp' | 'sms' | 'email' | 'push',
    provider: string,
    credentials: {
      apiKey: string;
      secretKey?: string;
      fromEmail?: string;
      fromPhone?: string;
      webhookUrl?: string;
    },
    isActive: boolean = true
  ): Promise<void> {
    
    const { error } = await supabase
      .from('tenant_providers')
      .upsert({
        tenant_id: tenantId,
        channel,
        provider,
        api_key: credentials.apiKey,
        secret_key: credentials.secretKey || null,
        from_email: credentials.fromEmail || null,
        from_phone: credentials.fromPhone || null,
        webhook_url: credentials.webhookUrl || null,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      throw new Error(`Error configurando proveedor: ${error.message}`);
    }

    this.logger.log(`✅ Proveedor ${provider} configurado para tenant ${tenantId} en canal ${channel}`);
  }
}
```

### **4. Logging de mensajes**

```typescript
// messagingService.ts - Logging con Supabase
export class MessagingService {
  
  async logMessage(messageLog: {
    tenantId: string;
    channel: string;
    provider: string;
    toAddress: string;
    fromAddress?: string;
    subject?: string;
    body?: string;
    status: 'pending' | 'sent' | 'delivered' | 'failed';
    providerMessageId?: string;
    errorMessage?: string;
  }): Promise<void> {
    
    const { error } = await supabase
      .from('message_logs')
      .insert({
        tenant_id: messageLog.tenantId,
        channel: messageLog.channel,
        provider: messageLog.provider,
        to_address: messageLog.toAddress,
        from_address: messageLog.fromAddress,
        subject: messageLog.subject,
        body: messageLog.body,
        status: messageLog.status,
        provider_message_id: messageLog.providerMessageId,
        error_message: messageLog.errorMessage,
      });

    if (error) {
      this.logger.error(`Error guardando log: ${error.message}`);
    }
  }

  async getMessageLogs(
    tenantId: string, 
    channel?: string, 
    limit: number = 50,
    offset: number = 0
  ): Promise<MessageLog[]> {
    
    let query = supabase
      .from('message_logs')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (channel) {
      query = query.eq('channel', channel);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error obteniendo logs: ${error.message}`);
    }

    return data || [];
  }
}
```

## 💰 **Costos estimados**

### **Supabase Pricing:**
- **Gratis**: 500MB DB, 2GB bandwidth, 50MB file storage
- **Pro ($25/mes)**: 8GB DB, 250GB bandwidth, 100GB file storage
- **Team ($599/mes)**: 500GB DB, 8TB bandwidth, 1TB file storage

### **Estimación para PipeCore:**
```
100 tenants, 10K mensajes/día:
- DB: ~100MB/mes
- Bandwidth: ~50MB/mes
- Plan recomendado: GRATIS ✅

1000 tenants, 100K mensajes/día:
- DB: ~1GB/mes  
- Bandwidth: ~500MB/mes
- Plan recomendado: Pro ($25/mes) ✅

10000 tenants, 1M mensajes/día:
- DB: ~10GB/mes
- Bandwidth: ~5GB/mes  
- Plan recomendado: Team ($599/mes) ✅
```

## 🎯 **Recomendación final**

### ✅ **Usa Supabase PostgreSQL porque:**

1. **PostgreSQL nativo** - Tu esquema actual funciona sin cambios
2. **APIs automáticas** - REST y GraphQL generados automáticamente
3. **Real-time** - Para dashboards en vivo (opcional)
4. **Row Level Security** - Seguridad multi-tenant integrada
5. **Escalabilidad** - Crece contigo sin configuración
6. **Precio** - Gratis para empezar, $25/mes para producción
7. **Setup rápido** - 5 minutos para tener todo funcionando

### 🚀 **Plan de migración:**

1. **Fase 1** (Ahora): Usar variables de entorno + Supabase para logs
2. **Fase 2** (Próximo): Migrar configuraciones de tenants a Supabase
3. **Fase 3** (Futuro): Dashboard en tiempo real con Supabase real-time

**Supabase es la opción perfecta para PipeCore - PostgreSQL con superpoderes, sin la complejidad de AWS.** 🎉
