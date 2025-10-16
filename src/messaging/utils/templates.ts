export interface TemplateVariable {
  name: string;
  description: string;
  required: boolean;
  type: 'string' | 'number' | 'date' | 'currency';
  example: string;
}

export interface MessageTemplate {
  id: string;
  tenantId: string;
  name: string;
  content: string;
  channel: 'sms' | 'whatsapp' | 'email';
  variables: TemplateVariable[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Plantillas predefinidas comunes
 */
export const PREDEFINED_TEMPLATES: Omit<MessageTemplate, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'order_confirmation',
    content: '¡Hola {{customerName}}! 🎉\n\nTu pedido #{{orderId}} ha sido confirmado.\n\n📋 Detalles:\n• Total: ${{total}}\n• Tiempo estimado: {{estimatedTime}}\n\n¡Gracias por elegirnos! 🙏',
    channel: 'whatsapp',
    variables: [
      { name: 'customerName', description: 'Nombre del cliente', required: true, type: 'string', example: 'Juan Pérez' },
      { name: 'orderId', description: 'ID del pedido', required: true, type: 'string', example: 'ORD-123' },
      { name: 'total', description: 'Total del pedido', required: true, type: 'currency', example: '15.990' },
      { name: 'estimatedTime', description: 'Tiempo estimado de entrega', required: true, type: 'string', example: '30-45 minutos' },
    ],
    isActive: true,
  },
  {
    name: 'delivery_update',
    content: '📦 Actualización de tu pedido #{{orderId}}\n\nEstado: {{status}}\n{{#if deliveryTime}}Tiempo estimado: {{deliveryTime}}{{/if}}\n\n{{#if driverName}}Tu repartidor: {{driverName}}{{/if}}',
    channel: 'whatsapp',
    variables: [
      { name: 'orderId', description: 'ID del pedido', required: true, type: 'string', example: 'ORD-123' },
      { name: 'status', description: 'Estado actual del pedido', required: true, type: 'string', example: 'En camino' },
      { name: 'deliveryTime', description: 'Tiempo estimado de entrega', required: false, type: 'string', example: '15 minutos' },
      { name: 'driverName', description: 'Nombre del repartidor', required: false, type: 'string', example: 'Carlos González' },
    ],
    isActive: true,
  },
  {
    name: 'payment_confirmation',
    content: '✅ Pago confirmado\n\nPedido #{{orderId}}\nMonto: ${{amount}}\nMétodo: {{paymentMethod}}\nFecha: {{paymentDate}}\n\n¡Tu pedido está siendo preparado! 🍕',
    channel: 'whatsapp',
    variables: [
      { name: 'orderId', description: 'ID del pedido', required: true, type: 'string', example: 'ORD-123' },
      { name: 'amount', description: 'Monto del pago', required: true, type: 'currency', example: '15.990' },
      { name: 'paymentMethod', description: 'Método de pago', required: true, type: 'string', example: 'Tarjeta de crédito' },
      { name: 'paymentDate', description: 'Fecha del pago', required: true, type: 'date', example: '15/01/2024 14:30' },
    ],
    isActive: true,
  },
  {
    name: 'welcome_message',
    content: '¡Bienvenido a {{businessName}}! 👋\n\nEstamos aquí para ayudarte con tus pedidos.\n\nPuedes:\n• Ver nuestro menú: {{menuUrl}}\n• Hacer un pedido\n• Consultar horarios\n• Contactar soporte\n\n¡Esperamos verte pronto! 😊',
    channel: 'whatsapp',
    variables: [
      { name: 'businessName', description: 'Nombre del negocio', required: true, type: 'string', example: 'Pizza Corner' },
      { name: 'menuUrl', description: 'URL del menú', required: true, type: 'string', example: 'https://pizzacorner.com/menu' },
    ],
    isActive: true,
  },
  {
    name: 'order_ready',
    content: '🍕 ¡Tu pedido está listo!\n\nPedido #{{orderId}}\n\nPuedes recogerlo en:\n📍 {{pickupLocation}}\n\n{{#if instructions}}{{instructions}}{{/if}}',
    channel: 'whatsapp',
    variables: [
      { name: 'orderId', description: 'ID del pedido', required: true, type: 'string', example: 'ORD-123' },
      { name: 'pickupLocation', description: 'Ubicación de recogida', required: true, type: 'string', example: 'Av. Principal 123' },
      { name: 'instructions', description: 'Instrucciones adicionales', required: false, type: 'string', example: 'Llamar al llegar' },
    ],
    isActive: true,
  },
  {
    name: 'delivery_completed',
    content: '🎉 ¡Entrega completada!\n\nPedido #{{orderId}} entregado exitosamente.\n\n¡Esperamos que disfrutes tu comida!\n\n¿Todo salió bien? Califica tu experiencia: {{ratingUrl}}',
    channel: 'whatsapp',
    variables: [
      { name: 'orderId', description: 'ID del pedido', required: true, type: 'string', example: 'ORD-123' },
      { name: 'ratingUrl', description: 'URL para calificar', required: true, type: 'string', example: 'https://pizzacorner.com/rate/ORD-123' },
    ],
    isActive: true,
  },
  // Plantillas para SMS (más cortas)
  {
    name: 'sms_order_confirmation',
    content: '{{businessName}}: Pedido #{{orderId}} confirmado. Total: ${{total}}. Tiempo estimado: {{estimatedTime}}',
    channel: 'sms',
    variables: [
      { name: 'businessName', description: 'Nombre del negocio', required: true, type: 'string', example: 'Pizza Corner' },
      { name: 'orderId', description: 'ID del pedido', required: true, type: 'string', example: 'ORD-123' },
      { name: 'total', description: 'Total del pedido', required: true, type: 'currency', example: '15.990' },
      { name: 'estimatedTime', description: 'Tiempo estimado', required: true, type: 'string', example: '30 min' },
    ],
    isActive: true,
  },
  {
    name: 'sms_delivery_update',
    content: '{{businessName}}: Pedido #{{orderId}} {{status}}{{#if deliveryTime}} - {{deliveryTime}}{{/if}}',
    channel: 'sms',
    variables: [
      { name: 'businessName', description: 'Nombre del negocio', required: true, type: 'string', example: 'Pizza Corner' },
      { name: 'orderId', description: 'ID del pedido', required: true, type: 'string', example: 'ORD-123' },
      { name: 'status', description: 'Estado del pedido', required: true, type: 'string', example: 'en camino' },
      { name: 'deliveryTime', description: 'Tiempo estimado', required: false, type: 'string', example: '15 min' },
    ],
    isActive: true,
  },
  // Plantillas para Email
  {
    name: 'email_order_confirmation',
    content: `
      <h2>¡Hola {{customerName}}! 🎉</h2>
      <p>Tu pedido #{{orderId}} ha sido confirmado y está siendo preparado.</p>
      
      <h3>📋 Detalles del pedido:</h3>
      <ul>
        <li><strong>Total:</strong> ${{total}}</li>
        <li><strong>Tiempo estimado:</strong> {{estimatedTime}}</li>
        <li><strong>Método de entrega:</strong> {{deliveryMethod}}</li>
      </ul>
      
      <p>Te notificaremos cuando tu pedido esté listo.</p>
      
      <p>¡Gracias por elegir {{businessName}}! 🙏</p>
    `,
    channel: 'email',
    variables: [
      { name: 'customerName', description: 'Nombre del cliente', required: true, type: 'string', example: 'Juan Pérez' },
      { name: 'orderId', description: 'ID del pedido', required: true, type: 'string', example: 'ORD-123' },
      { name: 'total', description: 'Total del pedido', required: true, type: 'currency', example: '15.990' },
      { name: 'estimatedTime', description: 'Tiempo estimado', required: true, type: 'string', example: '30-45 minutos' },
      { name: 'deliveryMethod', description: 'Método de entrega', required: true, type: 'string', example: 'Delivery' },
      { name: 'businessName', description: 'Nombre del negocio', required: true, type: 'string', example: 'Pizza Corner' },
    ],
    isActive: true,
  },
];

/**
 * Procesa una plantilla reemplazando las variables
 */
export function processTemplate(template: string, params: Record<string, any>): string {
  let processedTemplate = template;
  
  // Reemplazar variables simples {{variable}}
  Object.entries(params).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    processedTemplate = processedTemplate.replace(regex, String(value || ''));
  });
  
  // Procesar condicionales simples {{#if variable}}...{{/if}}
  processedTemplate = processedTemplate.replace(/\{\{#if\s+(\w+)\}\}(.*?)\{\{\/if\}\}/gs, (match, variable, content) => {
    return params[variable] ? content : '';
  });
  
  return processedTemplate;
}

/**
 * Valida que todos los parámetros requeridos estén presentes
 */
export function validateTemplateParams(template: MessageTemplate, params: Record<string, any>): string[] {
  const missingParams: string[] = [];
  
  template.variables.forEach(variable => {
    if (variable.required && !params[variable.name]) {
      missingParams.push(variable.name);
    }
  });
  
  return missingParams;
}

/**
 * Obtiene una plantilla predefinida por nombre
 */
export function getPredefinedTemplate(name: string): Omit<MessageTemplate, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'> | null {
  return PREDEFINED_TEMPLATES.find(template => template.name === name) || null;
}

/**
 * Obtiene todas las plantillas predefinidas para un canal específico
 */
export function getPredefinedTemplatesByChannel(channel: 'sms' | 'whatsapp' | 'email'): Omit<MessageTemplate, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>[] {
  return PREDEFINED_TEMPLATES.filter(template => template.channel === channel);
}

/**
 * Crea una plantilla personalizada
 */
export function createCustomTemplate(
  name: string,
  content: string,
  channel: 'sms' | 'whatsapp' | 'email',
  variables: TemplateVariable[]
): Omit<MessageTemplate, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'> {
  return {
    name,
    content,
    channel,
    variables,
    isActive: true,
  };
}
