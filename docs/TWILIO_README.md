# 📱 Integración Twilio - Guía Rápida

## 🚀 Inicio rápido

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Crea un archivo `.env` con tus credenciales de Twilio:

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
TWILIO_PHONE_NUMBER=+1234567890
```

### 3. Ejecutar la aplicación

```bash
npm run start:dev
```

### 4. Probar la integración

```bash
# Enviar mensaje de prueba
curl -X POST http://localhost:3000/twilio/test-message \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "test-tenant-123",
    "to": "+56912345678",
    "channel": "whatsapp"
  }'
```

## 📋 Endpoints principales

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/twilio/send` | Enviar mensaje SMS/WhatsApp |
| `POST` | `/twilio/webhook` | Webhook de Twilio |
| `POST` | `/twilio/templates` | Crear plantilla |
| `GET` | `/twilio/templates/{tenantId}` | Obtener plantillas |
| `POST` | `/twilio/templates/send` | Enviar con plantilla |
| `GET` | `/twilio/logs/{tenantId}` | Ver logs |
| `GET` | `/twilio/health` | Health check |

## 🔧 Ejemplos de uso

### Enviar mensaje simple

```javascript
const response = await fetch('/twilio/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tenantId: 'mi-restaurant',
    to: '+56988888888',
    channel: 'whatsapp',
    body: '¡Tu pedido está listo! 🍕'
  })
});
```

### Crear y usar plantilla

```javascript
// 1. Crear plantilla
await fetch('/twilio/templates', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tenantId: 'mi-restaurant',
    name: 'order_ready',
    content: 'Hola {{customerName}}, tu pedido #{{orderId}} está listo para recoger.',
    channel: 'whatsapp',
    variables: ['customerName', 'orderId']
  })
});

// 2. Usar plantilla
await fetch('/twilio/templates/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tenantId: 'mi-restaurant',
    templateId: 'order_ready',
    to: '+56988888888',
    channel: 'whatsapp',
    templateParams: {
      customerName: 'Juan Pérez',
      orderId: 'ORD-123'
    }
  })
});
```

## 🏗️ Arquitectura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Supabase      │    │   PipeCore      │    │     Twilio      │
│   Edge Function │───▶│   Twilio Module │───▶│   SMS/WhatsApp  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Message Logs  │
                       │   & Templates   │
                       └─────────────────┘
```

## 🔄 Flujo de trabajo

1. **Cliente hace pedido** → Supabase Edge Function
2. **Edge Function** → Llama a PipeCore `/twilio/send`
3. **PipeCore** → Envía mensaje via Twilio API
4. **Twilio** → Entrega mensaje al cliente
5. **Cliente responde** → Twilio webhook → PipeCore `/twilio/webhook`
6. **PipeCore** → Procesa respuesta y actualiza logs

## 📊 Monitoreo

### Ver logs de mensajes

```bash
curl http://localhost:3000/twilio/logs/mi-restaurant?limit=10
```

### Health check

```bash
curl http://localhost:3000/twilio/health
```

## 🛠️ Desarrollo

### Estructura de archivos

```
src/twilio/
├── constants/           # Constantes de Twilio
├── dto/                # DTOs para validación
├── entities/           # Entidades de datos
├── interfaces/         # Interfaces TypeScript
├── twilio.controller.ts # Controlador REST
├── twilio.service.ts   # Lógica de negocio
├── twilio.module.ts    # Módulo NestJS
└── index.ts           # Exports
```

### Agregar nueva funcionalidad

1. **Actualizar interfaces** en `interfaces/messaging.interface.ts`
2. **Agregar DTOs** en `dto/twilio.dto.ts`
3. **Implementar lógica** en `twilio.service.ts`
4. **Exponer endpoint** en `twilio.controller.ts`
5. **Documentar** en `docs/TWILIO_INTEGRATION.md`

## 🔒 Seguridad

- ✅ Validación de números de teléfono
- ✅ Límites de caracteres por canal
- ✅ Aislamiento por tenant
- ✅ Logs de todas las operaciones
- ✅ Manejo seguro de credenciales

## 📈 Próximos pasos

- [ ] Integrar con base de datos real
- [ ] Implementar colas de trabajos
- [ ] Agregar métricas y dashboards
- [ ] Soporte para mensajes programados
- [ ] Integración con WhatsApp Business API


CREATE TABLE message_logs (
  id serial PRIMARY KEY,
  tenant_id uuid NOT NULL,
  channel text,        -- whatsapp / sms / email
  provider text,       -- twilio / meta / sendgrid
  message_id text,
  to_number text,
  message_body text,
  status text,
  created_at timestamptz DEFAULT now()
);
