# 🏢 Ejemplos Multi-Tenant - PipeCore API

## 📖 Descripción

Este documento muestra ejemplos prácticos de cómo usar la arquitectura multi-tenant del PipeCore API, permitiendo que diferentes clientes (tenants) usen diferentes proveedores según sus necesidades.

## 🎯 Escenarios de ejemplo

### Escenario 1: TableFlow (Restaurante)
**Necesidades:** WhatsApp para pedidos, Email para confirmaciones
**Configuración:** Twilio + Resend

### Escenario 2: Genda (Servicios)
**Necesidades:** WhatsApp para citas, Email para recordatorios
**Configuración:** Meta + Resend

### Escenario 3: ROE (E-commerce)
**Necesidades:** Email para marketing, SMS para entregas
**Configuración:** SendGrid + Twilio

## 🚀 Implementación práctica

### 1. Configuración inicial de tenants

```typescript
// Configurar TableFlow con Twilio + Resend
await messageRouter.setProvider('tableflow_123', 'whatsapp', {
  provider: 'twilio',
  credentials: {
    accountSid: 'AC_tableflow_twilio_sid',
    authToken: 'tableflow_twilio_token',
    whatsappNumber: 'whatsapp:+14155238886',
  },
  isActive: true,
});

await messageRouter.setProvider('tableflow_123', 'email', {
  provider: 'resend',
  credentials: {
    apiKey: 're_tableflow_resend_key',
    fromEmail: 'noreply@tableflow.com',
  },
  isActive: true,
});

// Configurar Genda con Meta + Resend
await messageRouter.setProvider('genda_456', 'whatsapp', {
  provider: 'meta',
  credentials: {
    accessToken: 'meta_genda_access_token',
    phoneNumberId: 'genda_phone_number_id',
    verifyToken: 'genda_verify_token',
  },
  isActive: true,
});

await messageRouter.setProvider('genda_456', 'email', {
  provider: 'resend',
  credentials: {
    apiKey: 're_genda_resend_key',
    fromEmail: 'noreply@genda.com',
  },
  isActive: true,
});

// Configurar ROE con SendGrid + Twilio
await messageRouter.setProvider('roe_789', 'email', {
  provider: 'sendgrid',
  credentials: {
    apiKey: 'SG.roe_sendgrid_key',
    fromEmail: 'noreply@roe.com',
  },
  isActive: true,
});

await messageRouter.setProvider('roe_789', 'sms', {
  provider: 'twilio',
  credentials: {
    accountSid: 'AC_roe_twilio_sid',
    authToken: 'roe_twilio_token',
    phoneNumber: '+1234567890',
  },
  isActive: true,
});
```

### 2. Flujo de trabajo por tenant

#### TableFlow - Confirmación de pedido

```typescript
// 1. Cliente hace pedido
const orderData = {
  customerName: 'Juan Pérez',
  orderId: 'ORD-123',
  total: '15.990',
  estimatedTime: '30 minutos',
  customerPhone: '+56988888888',
  customerEmail: 'juan@email.com'
};

// 2. Enviar confirmación por WhatsApp (Twilio)
await fetch('https://pipecore-api.com/messaging/send/whatsapp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tenant_id: 'tableflow_123',
    to: orderData.customerPhone,
    body: `¡Hola ${orderData.customerName}! 🎉
    
Tu pedido #${orderData.orderId} ha sido confirmado.

📋 Detalles:
• Total: $${orderData.total}
• Tiempo estimado: ${orderData.estimatedTime}

¡Gracias por elegir TableFlow! 🙏`
  })
});

// 3. Enviar confirmación por Email (Resend)
await fetch('https://pipecore-api.com/messaging/send/email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tenant_id: 'tableflow_123',
    to: orderData.customerEmail,
    subject: `Confirmación de pedido #${orderData.orderId}`,
    htmlContent: `
      <h2>¡Hola ${orderData.customerName}! 🎉</h2>
      <p>Tu pedido #${orderData.orderId} ha sido confirmado y está siendo preparado.</p>
      
      <h3>📋 Detalles del pedido:</h3>
      <ul>
        <li><strong>Total:</strong> $${orderData.total}</li>
        <li><strong>Tiempo estimado:</strong> ${orderData.estimatedTime}</li>
      </ul>
      
      <p>Te notificaremos cuando tu pedido esté listo.</p>
      
      <p>¡Gracias por elegir TableFlow! 🙏</p>
    `,
    textContent: `¡Hola ${orderData.customerName}! Tu pedido #${orderData.orderId} ha sido confirmado. Total: $${orderData.total}`,
    from: 'noreply@tableflow.com'
  })
});
```

#### Genda - Recordatorio de cita

```typescript
// 1. Enviar recordatorio por WhatsApp (Meta)
await fetch('https://pipecore-api.com/messaging/send/whatsapp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tenant_id: 'genda_456',
    to: '+56988888888',
    body: `🔔 Recordatorio de cita
    
Hola! Te recordamos que tienes una cita mañana:

📅 Fecha: 15 de Enero, 2024
🕐 Hora: 10:00 AM
📍 Lugar: Clínica Genda - Av. Principal 123
👨‍⚕️ Doctor: Dr. Carlos González

¿Necesitas reprogramar? Responde "REPROGRAMAR"

¡Te esperamos! 👋`
  })
});

// 2. Enviar recordatorio por Email (Resend)
await fetch('https://pipecore-api.com/messaging/send/email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tenant_id: 'genda_456',
    to: 'cliente@email.com',
    subject: 'Recordatorio de cita - Genda',
    htmlContent: `
      <h2>🔔 Recordatorio de cita</h2>
      <p>Hola! Te recordamos que tienes una cita mañana:</p>
      
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
        <p><strong>📅 Fecha:</strong> 15 de Enero, 2024</p>
        <p><strong>🕐 Hora:</strong> 10:00 AM</p>
        <p><strong>📍 Lugar:</strong> Clínica Genda - Av. Principal 123</p>
        <p><strong>👨‍⚕️ Doctor:</strong> Dr. Carlos González</p>
      </div>
      
      <p>¿Necesitas reprogramar? <a href="https://genda.com/reprogramar">Haz clic aquí</a></p>
      
      <p>¡Te esperamos! 👋</p>
    `,
    from: 'noreply@genda.com'
  })
});
```

#### ROE - Notificación de entrega

```typescript
// 1. Enviar notificación por Email (SendGrid)
await fetch('https://pipecore-api.com/messaging/send/email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tenant_id: 'roe_789',
    to: 'cliente@email.com',
    subject: 'Tu pedido está en camino - ROE',
    htmlContent: `
      <h2>🚚 Tu pedido está en camino</h2>
      <p>¡Buenas noticias! Tu pedido #ORD-456 está siendo entregado.</p>
      
      <h3>📦 Detalles de la entrega:</h3>
      <ul>
        <li><strong>Producto:</strong> iPhone 15 Pro Max</li>
        <li><strong>Repartidor:</strong> Carlos González</li>
        <li><strong>Teléfono:</strong> +56912345678</li>
        <li><strong>Tiempo estimado:</strong> 15-30 minutos</li>
      </ul>
      
      <p>Rastrea tu pedido en tiempo real: <a href="https://roe.com/track/ORD-456">Ver ubicación</a></p>
    `,
    from: 'noreply@roe.com'
  })
});

// 2. Enviar SMS de entrega (Twilio)
await fetch('https://pipecore-api.com/messaging/send/sms', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tenant_id: 'roe_789',
    to: '+56988888888',
    body: 'ROE: Tu pedido #ORD-456 está en camino. Repartidor: Carlos +56912345678. Tiempo estimado: 15-30 min'
  })
});
```

### 3. Cambio dinámico de proveedores

```typescript
// Cambiar TableFlow de Resend a SendGrid
await fetch('https://pipecore-api.com/messaging/config/provider', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tenantId: 'tableflow_123',
    channel: 'email',
    provider: 'sendgrid',
    credentials: {
      apiKey: 'SG.new_tableflow_sendgrid_key',
      fromEmail: 'noreply@tableflow.com'
    },
    isActive: true
  })
});

// Cambiar Genda de Meta a Twilio para WhatsApp
await fetch('https://pipecore-api.com/messaging/config/provider', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tenantId: 'genda_456',
    channel: 'whatsapp',
    provider: 'twilio',
    credentials: {
      accountSid: 'AC.genda_twilio_sid',
      authToken: 'genda_twilio_token',
      whatsappNumber: 'whatsapp:+14155238886'
    },
    isActive: true
  })
});
```

### 4. Monitoreo y logs por tenant

```typescript
// Obtener logs de TableFlow
const tableflowLogs = await fetch('https://pipecore-api.com/messaging/logs/tableflow_123?limit=50');

// Obtener estadísticas de Genda
const gendaStats = await fetch('https://pipecore-api.com/messaging/stats/genda_456');

// Obtener configuración de ROE
const roeConfig = await fetch('https://pipecore-api.com/messaging/config/roe_789');
```

## 🔧 Configuración de webhooks

### Webhooks por tenant

```typescript
// Webhook de TableFlow (Twilio WhatsApp)
POST /messaging/webhook/whatsapp?tenant_id=tableflow_123&provider=twilio

// Webhook de Genda (Meta WhatsApp)
POST /messaging/webhook/whatsapp?tenant_id=genda_456&provider=meta

// Webhook de ROE (SendGrid Email)
POST /messaging/webhook/email?tenant_id=roe_789&provider=sendgrid
```

## 📊 Ventajas de la arquitectura multi-tenant

### ✅ Flexibilidad
- Cada tenant puede usar el proveedor que prefiera
- Cambio dinámico sin downtime
- Configuración independiente por canal

### ✅ Costos optimizados
- TableFlow usa Resend (más barato) para emails
- ROE usa SendGrid (más funcionalidades) para marketing
- Genda usa Meta (mejor para WhatsApp Business)

### ✅ Aislamiento
- Cada tenant tiene sus propias credenciales
- Logs separados por tenant
- Configuración independiente

### ✅ Escalabilidad
- Fácil agregar nuevos tenants
- Nuevos proveedores sin afectar existentes
- Migración gradual de proveedores

## 🚀 Próximos pasos

1. **Dashboard de configuración** - Interfaz web para gestionar proveedores
2. **Métricas por tenant** - Analytics detallados por cliente
3. **A/B testing** - Probar diferentes proveedores automáticamente
4. **Alertas** - Notificaciones cuando un proveedor falla
5. **Backup automático** - Cambio automático a proveedor secundario
