import { Injectable, Logger } from '@nestjs/common';
import { WebhookEvent, WebhookValidationResult, WebhookConfig } from '../interfaces';

@Injectable()
export class WebhookValidationService {
  private readonly logger = new Logger(WebhookValidationService.name);

  /**
   * Valida un evento de webhook
   */
  async validateEvent(event: WebhookEvent): Promise<WebhookValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validar eventId
    if (!event.eventId || event.eventId.trim().length === 0) {
      errors.push('El ID del evento es requerido');
    } else if (event.eventId.length > 100) {
      errors.push('El ID del evento no puede exceder 100 caracteres');
    }

    // Validar eventType
    if (!event.eventType || event.eventType.trim().length === 0) {
      errors.push('El tipo de evento es requerido');
    } else {
      const validEventTypes = [
        'payment.completed',
        'payment.failed',
        'payment.cancelled',
        'delivery.completed',
        'delivery.failed',
        'delivery.cancelled',
        'message.delivered',
        'message.failed',
        'message.read',
      ];
      
      if (!validEventTypes.includes(event.eventType)) {
        warnings.push(`Tipo de evento no reconocido: ${event.eventType}`);
      }
    }

    // Validar tenantId
    if (!event.tenantId || event.tenantId.trim().length === 0) {
      errors.push('El ID del tenant es requerido');
    } else if (event.tenantId.length > 50) {
      errors.push('El ID del tenant no puede exceder 50 caracteres');
    }

    // Validar data
    if (!event.data || typeof event.data !== 'object') {
      errors.push('Los datos del evento son requeridos y deben ser un objeto');
    } else {
      const dataSize = JSON.stringify(event.data).length;
      if (dataSize > 1000000) { // 1MB
        errors.push('Los datos del evento son demasiado grandes (máximo 1MB)');
      } else if (dataSize > 100000) { // 100KB
        warnings.push('Los datos del evento son grandes, podría afectar el rendimiento');
      }
    }

    // Validar source
    if (!event.source || event.source.trim().length === 0) {
      errors.push('La fuente del evento es requerida');
    } else if (event.source.length > 50) {
      errors.push('La fuente del evento no puede exceder 50 caracteres');
    }

    // Validar timestamp
    if (!event.timestamp || !(event.timestamp instanceof Date)) {
      errors.push('El timestamp del evento debe ser una fecha válida');
    } else {
      const now = new Date();
      const timeDiff = Math.abs(now.getTime() - event.timestamp.getTime());
      
      if (timeDiff > 24 * 60 * 60 * 1000) { // 24 horas
        warnings.push('El timestamp del evento está muy alejado de la hora actual');
      }
    }

    this.logger.log(`Validación de evento completada: ${errors.length} errores, ${warnings.length} advertencias`);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Valida webhook entrante de proveedor externo
   */
  async validateIncomingWebhook(
    provider: string,
    payload: any,
    signature?: string
  ): Promise<WebhookValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validar proveedor
    const validProviders = ['mercadopago', 'transbank', 'stripe', 'twilio', 'meta', 'sendgrid', 'resend', 'uber', 'rappi'];
    if (!validProviders.includes(provider.toLowerCase())) {
      errors.push(`Proveedor no válido: ${provider}`);
    }

    // Validar payload
    if (!payload || typeof payload !== 'object') {
      errors.push('El payload del webhook debe ser un objeto válido');
    }

    // Validar firma según el proveedor
    if (signature) {
      switch (provider.toLowerCase()) {
        case 'mercadopago':
          this.validateMercadoPagoSignature(payload, signature, errors, warnings);
          break;
        case 'stripe':
          this.validateStripeSignature(payload, signature, errors, warnings);
          break;
        case 'twilio':
          this.validateTwilioSignature(payload, signature, errors, warnings);
          break;
        default:
          warnings.push(`Validación de firma no implementada para ${provider}`);
      }
    } else {
      warnings.push(`Firma del webhook no presente para ${provider}`);
    }

    // Validaciones específicas por proveedor
    switch (provider.toLowerCase()) {
      case 'mercadopago':
        this.validateMercadoPagoPayload(payload, errors, warnings);
        break;
      case 'transbank':
        this.validateTransbankPayload(payload, errors, warnings);
        break;
      case 'stripe':
        this.validateStripePayload(payload, errors, warnings);
        break;
      case 'twilio':
        this.validateTwilioPayload(payload, errors, warnings);
        break;
    }

    this.logger.log(`Validación de webhook ${provider} completada: ${errors.length} errores, ${warnings.length} advertencias`);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Valida configuración de webhook
   */
  async validateWebhookConfig(config: WebhookConfig): Promise<WebhookValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validar tenantId
    if (!config.tenantId || config.tenantId.trim().length === 0) {
      errors.push('El ID del tenant es requerido');
    }

    // Validar eventType
    if (!config.eventType || config.eventType.trim().length === 0) {
      errors.push('El tipo de evento es requerido');
    }

    // Validar webhookUrl
    if (!config.webhookUrl || config.webhookUrl.trim().length === 0) {
      errors.push('La URL del webhook es requerida');
    } else if (!this.isValidUrl(config.webhookUrl)) {
      errors.push('La URL del webhook no es válida');
    } else {
      if (!config.webhookUrl.startsWith('https://')) {
        errors.push('La URL del webhook debe usar HTTPS');
      }
    }

    // Validar secret
    if (!config.secret || config.secret.trim().length === 0) {
      errors.push('El secreto del webhook es requerido');
    } else if (config.secret.length < 16) {
      warnings.push('El secreto del webhook es muy corto, se recomienda al menos 16 caracteres');
    }

    // Validar retryAttempts
    if (config.retryAttempts < 0 || config.retryAttempts > 10) {
      errors.push('Los intentos de reintento deben estar entre 0 y 10');
    }

    // Validar timeout
    if (config.timeout < 1000 || config.timeout > 300000) {
      errors.push('El timeout debe estar entre 1000ms y 300000ms (5 minutos)');
    }

    this.logger.log(`Validación de configuración de webhook completada: ${errors.length} errores, ${warnings.length} advertencias`);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Valida URL de webhook
   */
  async validateWebhookUrl(webhookUrl: string): Promise<WebhookValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!webhookUrl || webhookUrl.trim().length === 0) {
      errors.push('La URL del webhook es requerida');
      return { isValid: false, errors, warnings };
    }

    if (!this.isValidUrl(webhookUrl)) {
      errors.push('La URL del webhook no es válida');
    } else {
      if (!webhookUrl.startsWith('https://')) {
        errors.push('La URL del webhook debe usar HTTPS');
      }

      if (webhookUrl.includes('localhost') || webhookUrl.includes('127.0.0.1')) {
        warnings.push('La URL del webhook apunta a localhost, verificar configuración');
      }

      // Verificar si la URL responde (opcional)
      try {
        const response = await fetch(webhookUrl, { 
          method: 'HEAD',
          signal: AbortSignal.timeout(5000) // 5 segundos timeout
        });
        
        if (response.status >= 400) {
          warnings.push(`La URL del webhook retorna status ${response.status}`);
        }
      } catch (error) {
        warnings.push('No se pudo verificar la disponibilidad de la URL del webhook');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Valida payload de MercadoPago
   */
  private validateMercadoPagoPayload(payload: any, errors: string[], warnings: string[]): void {
    if (!payload.id && !payload.data?.id) {
      errors.push('ID de pago de MercadoPago es requerido');
    }

    if (!payload.type) {
      errors.push('Tipo de evento de MercadoPago es requerido');
    }

    if (!payload.date_created) {
      warnings.push('Fecha de creación de MercadoPago no presente');
    }
  }

  /**
   * Valida payload de Transbank
   */
  private validateTransbankPayload(payload: any, errors: string[], warnings: string[]): void {
    if (!payload.buy_order) {
      errors.push('Buy order de Transbank es requerido');
    }

    if (!payload.token) {
      errors.push('Token de Transbank es requerido');
    }

    if (!payload.status) {
      warnings.push('Status de Transbank no presente');
    }
  }

  /**
   * Valida payload de Stripe
   */
  private validateStripePayload(payload: any, errors: string[], warnings: string[]): void {
    if (!payload.id) {
      errors.push('ID de evento de Stripe es requerido');
    }

    if (!payload.type) {
      errors.push('Tipo de evento de Stripe es requerido');
    }

    if (!payload.data?.object) {
      errors.push('Objeto de datos de Stripe es requerido');
    }
  }

  /**
   * Valida payload de Twilio
   */
  private validateTwilioPayload(payload: any, errors: string[], warnings: string[]): void {
    if (!payload.MessageSid) {
      errors.push('MessageSid de Twilio es requerido');
    }

    if (!payload.MessageStatus) {
      errors.push('MessageStatus de Twilio es requerido');
    }
  }

  /**
   * Valida firma de MercadoPago
   */
  private validateMercadoPagoSignature(payload: any, signature: string, errors: string[], warnings: string[]): void {
    // En una implementación real, aquí se validaría la firma HMAC
    if (!signature || signature.length < 10) {
      errors.push('Firma de MercadoPago inválida');
    }
  }

  /**
   * Valida firma de Stripe
   */
  private validateStripeSignature(payload: any, signature: string, errors: string[], warnings: string[]): void {
    // En una implementación real, aquí se validaría la firma HMAC
    if (!signature || !signature.startsWith('t=')) {
      errors.push('Firma de Stripe inválida');
    }
  }

  /**
   * Valida firma de Twilio
   */
  private validateTwilioSignature(payload: any, signature: string, errors: string[], warnings: string[]): void {
    // En una implementación real, aquí se validaría la firma HMAC
    if (!signature || signature.length < 10) {
      errors.push('Firma de Twilio inválida');
    }
  }

  /**
   * Valida formato de URL
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Valida formato de email
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Valida tamaño de payload
   */
  private validatePayloadSize(payload: any, maxSizeKB: number = 1024): { isValid: boolean; sizeKB: number } {
    const payloadString = JSON.stringify(payload);
    const sizeKB = Buffer.byteLength(payloadString, 'utf8') / 1024;
    
    return {
      isValid: sizeKB <= maxSizeKB,
      sizeKB: Math.round(sizeKB * 100) / 100,
    };
  }

  /**
   * Valida estructura de datos específica por tipo de evento
   */
  async validateEventData(eventType: string, data: any): Promise<WebhookValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    switch (eventType) {
      case 'payment.completed':
        this.validatePaymentCompletedData(data, errors, warnings);
        break;
      case 'payment.failed':
        this.validatePaymentFailedData(data, errors, warnings);
        break;
      case 'delivery.completed':
        this.validateDeliveryCompletedData(data, errors, warnings);
        break;
      case 'message.delivered':
        this.validateMessageDeliveredData(data, errors, warnings);
        break;
      default:
        warnings.push(`Validación específica no implementada para evento: ${eventType}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Valida datos de evento de pago completado
   */
  private validatePaymentCompletedData(data: any, errors: string[], warnings: string[]): void {
    if (!data.paymentId) {
      errors.push('paymentId es requerido para eventos de pago');
    }

    if (!data.amount || typeof data.amount !== 'number' || data.amount <= 0) {
      errors.push('amount debe ser un número positivo');
    }

    if (!data.currency) {
      errors.push('currency es requerido para eventos de pago');
    }
  }

  /**
   * Valida datos de evento de pago fallido
   */
  private validatePaymentFailedData(data: any, errors: string[], warnings: string[]): void {
    if (!data.paymentId) {
      errors.push('paymentId es requerido para eventos de pago');
    }

    if (!data.errorMessage) {
      errors.push('errorMessage es requerido para eventos de pago fallido');
    }
  }

  /**
   * Valida datos de evento de delivery completado
   */
  private validateDeliveryCompletedData(data: any, errors: string[], warnings: string[]): void {
    if (!data.deliveryId) {
      errors.push('deliveryId es requerido para eventos de delivery');
    }

    if (!data.orderId) {
      errors.push('orderId es requerido para eventos de delivery');
    }
  }

  /**
   * Valida datos de evento de mensaje entregado
   */
  private validateMessageDeliveredData(data: any, errors: string[], warnings: string[]): void {
    if (!data.messageId) {
      errors.push('messageId es requerido para eventos de mensaje');
    }

    if (!data.channel) {
      errors.push('channel es requerido para eventos de mensaje');
    } else if (!['sms', 'whatsapp', 'email'].includes(data.channel)) {
      errors.push('channel debe ser sms, whatsapp o email');
    }

    if (!data.to) {
      errors.push('to es requerido para eventos de mensaje');
    }
  }
}
