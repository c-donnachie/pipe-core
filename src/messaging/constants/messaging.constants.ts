export const MESSAGING_CONSTANTS = {
  // Estados de mensajes
  MESSAGE_STATUS: {
    QUEUED: 'queued',
    SENDING: 'sending',
    SENT: 'sent',
    DELIVERED: 'delivered',
    UNDELIVERED: 'undelivered',
    FAILED: 'failed',
    RECEIVED: 'received',
    BOUNCED: 'bounced',
    OPENED: 'opened',
    CLICKED: 'clicked',
  },

  // Canales de mensajería
  CHANNELS: {
    SMS: 'sms',
    WHATSAPP: 'whatsapp',
    EMAIL: 'email',
  },

  // Direcciones de mensaje
  DIRECTION: {
    INBOUND: 'inbound',
    OUTBOUND: 'outbound',
  },

  // URLs base de proveedores
  BASE_URLS: {
    TWILIO: 'https://api.twilio.com/2010-04-01/Accounts',
    SENDGRID: 'https://api.sendgrid.com/v3',
    RESEND: 'https://api.resend.com',
  },

  // Límites de caracteres
  LIMITS: {
    SMS_MAX_LENGTH: 1600,
    WHATSAPP_MAX_LENGTH: 4096,
    EMAIL_SUBJECT_MAX_LENGTH: 78,
    EMAIL_BODY_MAX_LENGTH: 1000000,
    MEDIA_MAX_FILES: 10,
  },

  // Plantillas predefinidas
  TEMPLATES: {
    ORDER_CONFIRMATION: 'order_confirmation',
    DELIVERY_UPDATE: 'delivery_update',
    PAYMENT_CONFIRMATION: 'payment_confirmation',
    WELCOME_MESSAGE: 'welcome_message',
    ORDER_READY: 'order_ready',
    DELIVERY_COMPLETED: 'delivery_completed',
    PASSWORD_RESET: 'password_reset',
    ACCOUNT_VERIFICATION: 'account_verification',
    NEWSLETTER: 'newsletter',
    PROMOTION: 'promotion',
  },

  // Códigos de error comunes
  ERROR_CODES: {
    // Twilio
    TWILIO_INVALID_PHONE_NUMBER: 21211,
    TWILIO_MESSAGE_BODY_REQUIRED: 21602,
    TWILIO_INVALID_FROM_NUMBER: 21606,
    TWILIO_INVALID_TO_NUMBER: 21614,
    TWILIO_MESSAGE_QUOTA_EXCEEDED: 21610,
    TWILIO_ACCOUNT_SUSPENDED: 20003,
    
    // Email
    EMAIL_INVALID_ADDRESS: 400,
    EMAIL_REJECTED: 550,
    EMAIL_QUOTA_EXCEEDED: 429,
    EMAIL_SERVICE_UNAVAILABLE: 503,
  },

  // Configuración de reintentos
  RETRY_CONFIG: {
    MAX_ATTEMPTS: 3,
    INITIAL_DELAY: 1000, // 1 segundo
    MAX_DELAY: 30000, // 30 segundos
    BACKOFF_MULTIPLIER: 2,
  },

  // Configuración de webhooks
  WEBHOOK_CONFIG: {
    TIMEOUT: 30000, // 30 segundos
    MAX_RETRIES: 3,
    SIGNATURE_HEADER: 'x-twilio-signature',
  },

  // Tipos de archivos permitidos para adjuntos
  ALLOWED_ATTACHMENT_TYPES: {
    IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    DOCUMENTS: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    AUDIO: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
    VIDEO: ['video/mp4', 'video/avi', 'video/mov'],
  },

  // Límites de archivos
  ATTACHMENT_LIMITS: {
    MAX_FILE_SIZE: 25 * 1024 * 1024, // 25MB
    MAX_FILES_PER_MESSAGE: 10,
  },

  // Configuración de plantillas por canal
  TEMPLATE_CONFIG: {
    SMS: {
      MAX_VARIABLES: 5,
      MAX_LENGTH: 1600,
    },
    WHATSAPP: {
      MAX_VARIABLES: 10,
      MAX_LENGTH: 4096,
      SUPPORTS_MEDIA: true,
    },
    EMAIL: {
      MAX_VARIABLES: 20,
      MAX_ATTACHMENTS: 10,
      SUPPORTS_HTML: true,
    },
  },
} as const;
