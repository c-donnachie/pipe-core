# 🔑 Flujo de Credenciales - PipeCore API

## 📖 Descripción

Este documento explica cómo funciona el sistema de credenciales en PipeCore API, desde la configuración actual (usando `.env`) hasta la implementación futura con base de datos.

## 🔄 Flujo actual (implementado)

### 1. **Configuración por defecto**

```typescript
// .env - Credenciales globales
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

// messageRouter.ts - Usa credenciales del .env
private getDefaultProvider(channel: 'whatsapp' | 'sms' | 'email' | 'push'): ProviderConfig {
  return {
    email: {
      provider: 'resend' as const,
      credentials: {
        apiKey: env.resend.apiKey,        // ← Del .env
        fromEmail: env.resend.fromEmail,  // ← Del .env
      },
      isActive: true,
    },
  };
}
```

### 2. **Uso actual**

```typescript
// Todos los tenants usan las mismas credenciales del .env
await messagingService.sendEmail('tableflow_123', 'cliente@email.com', {
  subject: 'Confirmación de pedido',
  htmlContent: '<h1>¡Pedido confirmado!</h1>',
  from: 'noreply@tableflow.com'
});
// ↓ Usa RESEND_API_KEY del .env

await messagingService.sendEmail('roe_789', 'cliente@email.com', {
  subject: 'Confirmación de pedido', 
  htmlContent: '<h1>¡Pedido confirmado!</h1>',
  from: 'noreply@roe.com'
});
// ↓ Usa la MISMA RESEND_API_KEY del .env
```

## 🏗️ Flujo futuro (con base de datos)

### 1. **Configuración multi-tenant**

```sql
-- Base de datos - Credenciales específicas por tenant
INSERT INTO tenant_providers (tenant_id, channel, provider, credentials) VALUES
('tableflow_123', 'email', 'resend', '{"apiKey": "re_tableflow_key", "fromEmail": "noreply@tableflow.com"}'),
('roe_789', 'email', 'sendgrid', '{"apiKey": "SG.roe_sendgrid_key", "fromEmail": "noreply@roe.com"}'),
('genda_456', 'email', 'resend', '{"apiKey": "re_genda_key", "fromEmail": "noreply@genda.com"}');
```

### 2. **Flujo de resolución**

```typescript
// messageRouter.ts - Versión con BD
async getProviderConfig(tenantId: string, channel: string): Promise<ProviderConfig> {
  
  // 1. Buscar en base de datos
  const dbConfig = await this.getTenantProviderFromDB(tenantId, channel);
  if (dbConfig) {
    console.log(`✅ Usando credenciales específicas de ${tenantId}`);
    return dbConfig;
  }

  // 2. Fallback a .env
  console.log(`⚠️ Usando credenciales por defecto para ${tenantId}`);
  return this.getDefaultProvider(channel);
}
```

### 3. **Uso futuro**

```typescript
// Cada tenant usa sus propias credenciales
await messagingService.sendEmail('tableflow_123', 'cliente@email.com', {
  subject: 'Confirmación de pedido',
  htmlContent: '<h1>¡Pedido confirmado!</h1>',
  from: 'noreply@tableflow.com'
});
// ↓ Usa re_tableflow_key (de BD)

await messagingService.sendEmail('roe_789', 'cliente@email.com', {
  subject: 'Confirmación de pedido',
  htmlContent: '<h1>¡Pedido confirmado!</h1>', 
  from: 'noreply@roe.com'
});
// ↓ Usa SG.roe_sendgrid_key (de BD)

await messagingService.sendEmail('new_tenant_999', 'cliente@email.com', {
  subject: 'Confirmación de pedido',
  htmlContent: '<h1>¡Pedido confirmado!</h1>',
  from: 'noreply@newtenant.com'
});
// ↓ Usa RESEND_API_KEY del .env (fallback)
```

## 🎯 Casos de uso prácticos

### Caso 1: TableFlow (Restaurante)
```typescript
// Configuración específica
tenant_id: 'tableflow_123'
email_provider: 'resend'
credentials: {
  apiKey: 're_tableflow_restaurant_key',
  fromEmail: 'noreply@tableflow.com'
}

// Uso
await messagingService.sendEmail('tableflow_123', 'cliente@email.com', {
  subject: 'Tu pedido está listo 🍕',
  htmlContent: '<h2>¡Tu pizza está lista para recoger!</h2>'
});
// ✅ Usa credenciales específicas de TableFlow
```

### Caso 2: ROE (E-commerce)
```typescript
// Configuración específica  
tenant_id: 'roe_789'
email_provider: 'sendgrid'
credentials: {
  apiKey: 'SG.roe_ecommerce_key',
  fromEmail: 'noreply@roe.com'
}

// Uso
await messagingService.sendEmail('roe_789', 'cliente@email.com', {
  subject: 'Tu compra ha sido enviada 📦',
  htmlContent: '<h2>¡Tu pedido está en camino!</h2>'
});
// ✅ Usa credenciales específicas de ROE
```

### Caso 3: Nuevo tenant (sin configuración)
```typescript
// Sin configuración específica
tenant_id: 'new_tenant_999'
// No hay entrada en tenant_providers

// Uso
await messagingService.sendEmail('new_tenant_999', 'cliente@email.com', {
  subject: 'Bienvenido 🎉',
  htmlContent: '<h2>¡Bienvenido a nuestro servicio!</h2>'
});
// ⚠️ Usa credenciales por defecto del .env
```

## 🔧 Implementación paso a paso

### Paso 1: Mantener funcionalidad actual
```typescript
// ✅ Ya implementado
// Todos los tenants usan credenciales del .env
// Sistema funciona sin base de datos
```

### Paso 2: Agregar soporte para BD (opcional)
```typescript
// 🔄 Futuro
// Buscar credenciales en BD primero
// Fallback a .env si no hay configuración
// Sin breaking changes
```

### Paso 3: Migrar tenants gradualmente
```typescript
// 🔄 Futuro
// Configurar credenciales específicas por tenant
// Migrar uno por uno
// Mantener .env como fallback
```

## 📊 Comparación de enfoques

| Aspecto | Actual (.env) | Futuro (BD + .env) |
|---------|---------------|-------------------|
| **Configuración** | Una sola para todos | Específica por tenant |
| **Seguridad** | Credenciales compartidas | Credenciales aisladas |
| **Flexibilidad** | Limitada | Total |
| **Mantenimiento** | Simple | Más complejo |
| **Escalabilidad** | Limitada | Excelente |
| **Costo** | Bajo | Medio |
| **Implementación** | ✅ Listo | 🔄 Futuro |

## 🚀 Ventajas del enfoque híbrido

### ✅ **Compatibilidad hacia atrás**
- El sistema actual sigue funcionando
- No hay breaking changes
- Migración gradual

### ✅ **Flexibilidad total**
- Cada tenant puede usar sus credenciales
- Cambio de proveedor sin código
- Configuración dinámica

### ✅ **Seguridad mejorada**
- Credenciales aisladas por tenant
- Rotación independiente
- No hay credenciales hardcodeadas

### ✅ **Escalabilidad**
- Fácil agregar nuevos tenants
- Sin límites de configuración
- Soporte para múltiples proveedores

## 🔮 Roadmap

### Fase 1: Mantener actual (✅ Implementado)
- Todos usan credenciales del `.env`
- Sistema funciona perfectamente
- Sin base de datos requerida

### Fase 2: Agregar soporte BD (🔄 Futuro)
- Implementar `DatabaseService`
- Actualizar `MessageRouter`
- Mantener fallback a `.env`

### Fase 3: Migrar tenants (🔄 Futuro)
- Configurar credenciales específicas
- Migrar gradualmente
- Mantener `.env` como fallback

### Fase 4: Optimización (🔄 Futuro)
- Dashboard de configuración
- Rotación automática de credenciales
- Monitoreo y alertas
