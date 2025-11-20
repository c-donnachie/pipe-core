# 📧 Integración Resend - PipeCore API

## 📖 Descripción

La integración con Resend permite al PipeCore API enviar correos electrónicos de alta calidad con soporte multi-tenant. Resend es una alternativa moderna a SendGrid, enfocada en desarrolladores con APIs más simples y mejor deliverability.

## 🔧 Configuración

### Variables de entorno requeridas

```bash
# Resend
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@pipecore.com
```

### Instalación de dependencias

```bash
# No se requieren dependencias adicionales, usa fetch nativo de Node.js
```

## 🚀 Endpoints disponibles

### 1. Enviar email

```http
POST /messaging/send/email
Content-Type: application/json

{
  "tenant_id": "tableflow_123",
  "to": "cliente@email.com",
  "subject": "Confirmación de pedido #ORD-123",
  "htmlContent": "<h2>¡Pedido confirmado!</h2><p>Tu pedido está siendo preparado...</p>",
  "textContent": "¡Pedido confirmado! Tu pedido está siendo preparado...",
  "from": "noreply@tableflow.com",
  "attachments": [
    {
      "filename": "recibo.pdf",
      "content": "base64_encoded_content",
      "path": "/path/to/file.pdf"
    }
  ]
}
```

### 2. Webhook de Resend

```http
POST /messaging/webhook/email?tenant_id=tableflow_123&provider=resend
Content-Type: application/json

{
  "type": "email.delivered",
  "data": {
    "email_id": "re_1234567890",
    "email": "cliente@email.com",
    "reason": null
  }
}
```

### 3. Configurar proveedor Resend para tenant

```http
POST /messaging/config/provider
Content-Type: application/json

{
  "tenantId": "tableflow_123",
  "channel": "email",
  "provider": "resend",
  "credentials": {
    "apiKey": "re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "fromEmail": "noreply@tableflow.com"
  },
  "isActive": true
}
```

### 4. Obtener configuración de tenant

```http
GET /messaging/config/tableflow_123
```

## 📊 Funcionalidades

### ✅ Características implementadas

- ✅ Envío de emails con HTML y texto plano
- ✅ Soporte para adjuntos (archivos)
- ✅ Webhooks para eventos (delivered, bounced, opened, clicked)
- ✅ Multi-tenant (cada tenant puede usar su propia API key)
- ✅ Cambio dinámico de proveedor (Resend ↔ SendGrid)
- ✅ Logs completos de emails
- ✅ Validación de emails
- ✅ Templates con variables
- ✅ Health check del servicio

### 🔄 Flujo de trabajo

1. **Envío de email**: Backend solicita envío → PipeCore selecciona proveedor → Resend envía → Log registrado
2. **Webhook de evento**: Resend webhook → PipeCore procesa → Log registrado → Acción opcional
3. **Multi-tenant**: Cada tenant puede tener su propia configuración de Resend

## 🏗️ Arquitectura multi-tenant

### Configuración por defecto (variables de entorno)

```typescript
// Todos los tenants usan Resend por defecto
{
  provider: 'resend',
  credentials: {
    apiKey: process.env.RESEND_API_KEY,
    fromEmail: process.env.RESEND_FROM_EMAIL,
  },
  isActive: true,
}
```

### Configuración específica por tenant

```typescript
// Tenant tableflow_123 usa Resend
await messageRouter.setProvider('tableflow_123', 'email', {
  provider: 'resend',
  credentials: {
    apiKey: 're_tableflow_specific_key',
    fromEmail: 'noreply@tableflow.com',
  },
  isActive: true,
});

// Tenant roe_789 usa SendGrid
await messageRouter.setProvider('roe_789', 'email', {
  provider: 'sendgrid',
  credentials: {
    apiKey: 'SG.roe_specific_key',
    fromEmail: 'noreply@roe.com',
  },
  isActive: true,
});
```

## 🔧 Ejemplos de uso

### Desde Supabase Edge Function

```typescript
// Enviar email con Resend
const response = await fetch('https://pipecore-api.com/messaging/send/email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tenant_id: 'tableflow_123',
    to: 'cliente@email.com',
    subject: 'Confirmación de pedido #ORD-123',
    htmlContent: `
      <h2>¡Hola {{customerName}}! 🎉</h2>
      <p>Tu pedido #{{orderId}} ha sido confirmado y está siendo preparado.</p>
      
      <h3>📋 Detalles del pedido:</h3>
      <ul>
        <li><strong>Total:</strong> ${{total}}</li>
        <li><strong>Tiempo estimado:</strong> {{estimatedTime}}</li>
      </ul>
      
      <p>Te notificaremos cuando tu pedido esté listo.</p>
      
      <p>¡Gracias por elegir {{businessName}}! 🙏</p>
    `,
    textContent: `¡Hola ${customerName}! Tu pedido #${orderId} ha sido confirmado. Total: $${total}`,
    from: 'noreply@tableflow.com'
  })
});
```

### Cambiar proveedor dinámicamente

```typescript
// Cambiar de SendGrid a Resend para un tenant específico
await fetch('https://pipecore-api.com/messaging/config/provider', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tenantId: 'tableflow_123',
    channel: 'email',
    provider: 'resend',
    credentials: {
      apiKey: 're_new_resend_key',
      fromEmail: 'noreply@tableflow.com'
    },
    isActive: true
  })
});
```

### Procesar webhooks de Resend

```typescript
// En el webhook handler
if (webhookData.type === 'email.delivered') {
  // Email entregado exitosamente
  console.log(`Email ${webhookData.data.email_id} entregado a ${webhookData.data.email}`);
} else if (webhookData.type === 'email.bounced') {
  // Email rebotado
  console.log(`Email ${webhookData.data.email_id} rebotado: ${webhookData.data.reason}`);
}
```

## 🔄 Ventajas de Resend vs SendGrid

| Característica | Resend | SendGrid |
|----------------|--------|----------|
| **API Simplicidad** | ✅ Muy simple | ❌ Compleja |
| **Deliverability** | ✅ Excelente | ✅ Excelente |
| **Precio** | ✅ Más económico | ❌ Más caro |
| **Developer Experience** | ✅ Enfocado en devs | ❌ Enfocado en marketing |
| **Setup Time** | ✅ 5 minutos | ❌ 30+ minutos |
| **Documentation** | ✅ Clara y concisa | ❌ Extensa pero confusa |

## 📈 Casos de uso recomendados

### ✅ Usar Resend cuando:
- Necesitas emails transaccionales simples
- Quieres mejor developer experience
- Buscas mejor precio
- Necesitas setup rápido
- Priorizas simplicidad

### ✅ Usar SendGrid cuando:
- Necesitas funcionalidades de marketing avanzadas
- Requieres segmentación compleja de audiencias
- Necesitas analytics detallados
- Ya tienes integración existente

## 🚨 Configuración de DNS

Para usar Resend con tu dominio personalizado:

### 1. Verificar dominio en Resend

```bash
# En el dashboard de Resend
# Agregar dominio: miempresa.com
# Configurar registros DNS
```

### 2. Configurar registros DNS

```dns
# Registro SPF
TXT: v=spf1 include:_spf.resend.com ~all

# Registro DKIM
TXT: resend._domainkey.miempresa.com

# Registro DMARC (opcional)
TXT: v=DMARC1; p=quarantine; rua=mailto:dmarc@miempresa.com
```

## 🔮 Próximas mejoras

- [ ] Integración con templates de Resend
- [ ] Soporte para batch sending
- [ ] Métricas en tiempo real
- [ ] A/B testing de proveedores
- [ ] Dashboard de configuración
- [ ] Retry automático con backoff
- [ ] Rate limiting por tenant
