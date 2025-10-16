# 🔧 Variables de entorno - PipeCore API

## Configuración completa

Copia este contenido a tu archivo `.env` y ajusta los valores según tu configuración:

```bash
# Puerto del servidor
PORT=3000

# Configuración de Uber Direct
UBER_DIRECT_CLIENT_ID=your_uber_client_id
UBER_DIRECT_CLIENT_SECRET=your_uber_client_secret
UBER_DIRECT_CUSTOMER_ID=your_uber_customer_id
UBER_AUTH_URL=https://login.uber.com/oauth/v2/token
UBER_BASE_URL=https://api.uber.com/v1

# Configuración de Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WEBHOOK_URL=https://tu-dominio.com/twilio/webhook

# Configuración de base de datos (si se implementa)
DATABASE_URL=postgresql://user:password@localhost:5432/pipecore

# Configuración de Redis (para colas de trabajos)
REDIS_URL=redis://localhost:6379

# Configuración de logging
LOG_LEVEL=info
LOG_FORMAT=json

# Configuración de seguridad
JWT_SECRET=your_jwt_secret_key
ENCRYPTION_KEY=your_encryption_key_32_chars
```

## 🔑 Cómo obtener credenciales de Twilio

1. **Crear cuenta en Twilio**: Ve a [twilio.com](https://www.twilio.com) y crea una cuenta
2. **Obtener Account SID y Auth Token**: En el Dashboard de Twilio, copia estos valores
3. **Configurar número de WhatsApp**: 
   - Ve a Messaging → Try it out → Send a WhatsApp message
   - Usa el número de sandbox: `whatsapp:+14155238886`
4. **Configurar número de teléfono**: Compra un número de teléfono para SMS
5. **Configurar webhook**: Configura la URL de tu webhook en Twilio Console

## 📱 Configuración de WhatsApp

Para usar WhatsApp en producción:

1. Aplica para WhatsApp Business API
2. Verifica tu número de teléfono de negocio
3. Actualiza `TWILIO_WHATSAPP_NUMBER` con tu número verificado

## 🔒 Seguridad

- Nunca commites el archivo `.env` al repositorio
- Usa diferentes credenciales para desarrollo y producción
- Rota las credenciales regularmente
- Usa variables de entorno en producción (Heroku, AWS, etc.)
