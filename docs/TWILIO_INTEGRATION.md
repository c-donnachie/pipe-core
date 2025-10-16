# 📱 Integración Twilio - PipeCore API

## 📖 Descripción

La integración con Twilio permite al PipeCore API enviar y recibir mensajes SMS y WhatsApp, gestionar plantillas de mensajes y mantener logs completos de todas las comunicaciones.

## 🔧 Configuración

### Variables de entorno requeridas

```bash
# Credenciales de Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WEBHOOK_URL=https://tu-dominio.com/twilio/webhook
```

### Instalación de dependencias

```bash
npm install twilio @types/twilio
```

## 🚀 Endpoints disponibles

### 1. Enviar mensaje

```http
POST /twilio/send
Content-Type: application/json

{
  "tenantId": "uuid-tenant-id",
  "to": "+56912345678",
  "channel": "whatsapp",
  "body": "Tu pedido ha sido confirmado ✅",
  "mediaUrls": ["https://example.com/image.jpg"],
  "templateId": "order_confirmation",
  "templateParams": {
    "customerName": "Juan Pérez",
    "orderId": "ORD-123"
  }
}
```

### 2. Webhook de Twilio

```http
POST /twilio/webhook
Content-Type: application/x-www-form-urlencoded

MessageSid=SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx&
From=+56912345678&
To=whatsapp:+14155238886&
Body=Hola, quiero hacer un pedido&
MessageStatus=received
```

### 3. Crear plantilla

```http
POST /twilio/templates
Content-Type: application/json

{
  "tenantId": "uuid-tenant-id",
  "name": "order_confirmation",
  "content": "Hola {{customerName}}, tu pedido #{{orderId}} ha sido confirmado. Total: ${{total}}",
  "channel": "whatsapp",
  "variables": ["customerName", "orderId", "total"],
  "isActive": true
}
```

### 4. Obtener plantillas por tenant

```http
GET /twilio/templates/{tenantId}
```

### 5. Enviar mensaje con plantilla

```http
POST /twilio/templates/send
Content-Type: application/json

{
  "tenantId": "uuid-tenant-id",
  "templateId": "order_confirmation",
  "to": "+56912345678",
  "channel": "whatsapp",
  "templateParams": {
    "customerName": "María González",
    "orderId": "ORD-456",
    "total": "15.990"
  }
}
```

### 6. Obtener logs de mensajes

```http
GET /twilio/logs/{tenantId}?limit=50
```

### 7. Mensaje de prueba

```http
POST /twilio/test-message
Content-Type: application/json

{
  "tenantId": "uuid-tenant-id",
  "to": "+56912345678",
  "channel": "whatsapp"
}
```

### 8. Health check

```http
GET /twilio/health
```

## 📊 Funcionalidades

### ✅ Características implementadas

- ✅ Envío de mensajes SMS y WhatsApp
- ✅ Recepción de webhooks de Twilio
- ✅ Sistema de plantillas con variables
- ✅ Logs completos de mensajes
- ✅ Validación de números de teléfono
- ✅ Manejo de medios adjuntos
- ✅ Multi-tenant (aislamiento por tenant)
- ✅ Manejo de errores y reintentos
- ✅ Health check del servicio

### 🔄 Flujo de trabajo

1. **Envío de mensaje**: El backend solicita envío → PipeCore valida → Twilio envía → Log registrado
2. **Recepción de mensaje**: Twilio webhook → PipeCore procesa → Log registrado → Respuesta opcional
3. **Plantillas**: Crear plantilla → Usar variables → Enviar mensaje personalizado

### 📝 Logs y auditoría

Cada mensaje se registra con:
- ID único del mensaje
- Tenant ID
- Números origen y destino
- Contenido del mensaje
- Canal (SMS/WhatsApp)
- Estado del mensaje
- Dirección (entrada/salida)
- Timestamps
- Datos del webhook (si aplica)
- Códigos y mensajes de error

### 🛡️ Seguridad

- Validación de números de teléfono
- Límites de caracteres por canal
- Límite de archivos adjuntos
- Aislamiento por tenant
- Logs de todas las operaciones

## 📋 Plantillas predefinidas

El sistema incluye plantillas comunes:

- `order_confirmation`: Confirmación de pedido
- `delivery_update`: Actualización de entrega
- `payment_confirmation`: Confirmación de pago
- `welcome_message`: Mensaje de bienvenida
- `order_ready`: Pedido listo
- `delivery_completed`: Entrega completada

## 🔧 Uso en el ecosistema

### Desde Supabase Edge Functions

```typescript
// En una Edge Function de Supabase
const response = await fetch('https://pipecore-api.com/twilio/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer token-tenant'
  },
  body: JSON.stringify({
    tenantId: 'tableflow_123',
    to: '+56988888888',
    channel: 'whatsapp',
    body: 'Tu pedido fue confirmado ✅',
    templateId: 'order_confirmation',
    templateParams: {
      customerName: 'Juan Pérez',
      orderId: 'ORD-123'
    }
  })
});
```

### Respuesta automática a mensajes entrantes

El webhook puede configurarse para responder automáticamente:

```typescript
// En el webhook handler
if (webhookData.Body.toLowerCase().includes('hola')) {
  await twilioService.sendMessage({
    tenantId: 'detected_tenant',
    to: webhookData.From,
    from: 'auto_response',
    body: '¡Hola! ¿En qué puedo ayudarte?',
    channel: 'whatsapp'
  });
}
```

## 🚨 Manejo de errores

### Códigos de error comunes

- `21211`: Número de teléfono inválido
- `21602`: Cuerpo del mensaje requerido
- `21606`: Número remitente inválido
- `21614`: Número destinatario inválido
- `21610`: Cuota de mensajes excedida
- `20003`: Cuenta suspendida

### Reintentos automáticos

El sistema puede configurarse para reintentar mensajes fallidos usando colas de trabajos.

## 📈 Métricas y monitoreo

- Total de mensajes enviados/recibidos por tenant
- Tasa de éxito por canal (SMS/WhatsApp)
- Tiempo de respuesta de webhooks
- Uso de plantillas
- Errores más comunes

## 🔮 Próximas mejoras

- [ ] Integración con WhatsApp Business API
- [ ] Soporte para mensajes programados
- [ ] Dashboard de métricas
- [ ] A/B testing de plantillas
- [ ] Integración con sistemas de CRM
- [ ] Soporte para mensajes de voz
