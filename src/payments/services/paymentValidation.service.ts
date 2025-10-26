import { Injectable, Logger } from '@nestjs/common';
import { CreatePaymentDto, PaymentValidationResult, PaymentWebhookPayload } from '../interfaces';

@Injectable()
export class PaymentValidationService {
  private readonly logger = new Logger(PaymentValidationService.name);

  /**
   * Valida los datos de un pago
   */
  async validatePayment(createPaymentDto: CreatePaymentDto): Promise<PaymentValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validar tenant ID
    if (!createPaymentDto.tenantId || createPaymentDto.tenantId.trim().length === 0) {
      errors.push('El ID del tenant es requerido');
    }

    // Validar monto
    if (!createPaymentDto.amount || createPaymentDto.amount <= 0) {
      errors.push('El monto debe ser mayor a 0');
    } else if (createPaymentDto.amount < 100) {
      warnings.push('El monto es muy bajo, podría no ser procesado por algunos proveedores');
    } else if (createPaymentDto.amount > 10000000) {
      warnings.push('El monto es muy alto, verificar límites del proveedor');
    }

    // Validar moneda
    if (!createPaymentDto.currency || createPaymentDto.currency.trim().length === 0) {
      errors.push('La moneda es requerida');
    } else {
      const validCurrencies = ['CLP', 'USD', 'EUR', 'ARS', 'BRL', 'MXN', 'UYU', 'COP', 'PEN'];
      if (!validCurrencies.includes(createPaymentDto.currency.toUpperCase())) {
        warnings.push(`Moneda ${createPaymentDto.currency} podría no ser soportada por todos los proveedores`);
      }
    }

    // Validar email del cliente
    if (createPaymentDto.customerEmail && !this.isValidEmail(createPaymentDto.customerEmail)) {
      errors.push('El formato del email del cliente no es válido');
    }

    // Validar teléfono del cliente
    if (createPaymentDto.customerPhone && !this.isValidPhone(createPaymentDto.customerPhone)) {
      warnings.push('El formato del teléfono del cliente podría no ser válido');
    }

    // Validar URLs
    if (createPaymentDto.returnUrl && !this.isValidUrl(createPaymentDto.returnUrl)) {
      errors.push('La URL de retorno no es válida');
    }

    if (createPaymentDto.cancelUrl && !this.isValidUrl(createPaymentDto.cancelUrl)) {
      errors.push('La URL de cancelación no es válida');
    }

    if (createPaymentDto.webhookUrl && !this.isValidUrl(createPaymentDto.webhookUrl)) {
      errors.push('La URL del webhook no es válida');
    }

    // Validar descripción
    if (createPaymentDto.description && createPaymentDto.description.length > 255) {
      errors.push('La descripción no puede exceder 255 caracteres');
    }

    // Validar metadata
    if (createPaymentDto.metadata) {
      const metadataKeys = Object.keys(createPaymentDto.metadata);
      if (metadataKeys.length > 20) {
        warnings.push('Demasiados campos en metadata, algunos proveedores podrían limitarlos');
      }

      metadataKeys.forEach(key => {
        if (key.length > 40) {
          errors.push(`La clave de metadata '${key}' es demasiado larga (máximo 40 caracteres)`);
        }
        if (typeof createPaymentDto.metadata![key] !== 'string' && typeof createPaymentDto.metadata![key] !== 'number') {
          errors.push(`El valor de metadata '${key}' debe ser string o number`);
        }
      });
    }

    this.logger.log(`Validación de pago completada: ${errors.length} errores, ${warnings.length} advertencias`);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Valida un webhook de pago
   */
  async validateWebhook(provider: string, webhookPayload: PaymentWebhookPayload): Promise<PaymentValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validar proveedor
    const validProviders = ['mercadopago', 'transbank', 'stripe'];
    if (!validProviders.includes(provider)) {
      errors.push(`Proveedor no válido: ${provider}`);
    }

    // Validar estructura básica del webhook
    if (!webhookPayload) {
      errors.push('El payload del webhook está vacío');
      return { isValid: false, errors, warnings };
    }

    // Validar evento
    if (!webhookPayload.event || webhookPayload.event.trim().length === 0) {
      errors.push('El evento del webhook es requerido');
    }

    // Validar datos
    if (!webhookPayload.data || typeof webhookPayload.data !== 'object') {
      errors.push('Los datos del webhook son requeridos');
    }

    // Validaciones específicas por proveedor
    switch (provider) {
      case 'mercadopago':
        this.validateMercadoPagoWebhook(webhookPayload, errors, warnings);
        break;
      case 'transbank':
        this.validateTransbankWebhook(webhookPayload, errors, warnings);
        break;
      case 'stripe':
        this.validateStripeWebhook(webhookPayload, errors, warnings);
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
   * Valida credenciales de un proveedor
   */
  async validateCredentials(provider: string, credentials: Record<string, any>): Promise<PaymentValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validar proveedor
    const validProviders = ['mercadopago', 'transbank', 'stripe'];
    if (!validProviders.includes(provider)) {
      errors.push(`Proveedor no válido: ${provider}`);
      return { isValid: false, errors, warnings };
    }

    // Validaciones específicas por proveedor
    switch (provider) {
      case 'mercadopago':
        this.validateMercadoPagoCredentials(credentials, errors, warnings);
        break;
      case 'transbank':
        this.validateTransbankCredentials(credentials, errors, warnings);
        break;
      case 'stripe':
        this.validateStripeCredentials(credentials, errors, warnings);
        break;
    }

    this.logger.log(`Validación de credenciales ${provider} completada: ${errors.length} errores, ${warnings.length} advertencias`);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Valida webhook de MercadoPago
   */
  private validateMercadoPagoWebhook(webhookPayload: PaymentWebhookPayload, errors: string[], warnings: string[]): void {
    if (!webhookPayload.data?.id) {
      errors.push('ID de pago de MercadoPago es requerido');
    }

    if (webhookPayload.event && !webhookPayload.event.startsWith('payment.')) {
      warnings.push(`Evento de MercadoPago no reconocido: ${webhookPayload.event}`);
    }

    if (!webhookPayload.signature) {
      warnings.push('Firma del webhook de MercadoPago no presente, podría ser un riesgo de seguridad');
    }
  }

  /**
   * Valida webhook de Transbank
   */
  private validateTransbankWebhook(webhookPayload: PaymentWebhookPayload, errors: string[], warnings: string[]): void {
    if (!webhookPayload.data?.buy_order) {
      errors.push('Buy order de Transbank es requerido');
    }

    if (webhookPayload.event && !webhookPayload.event.startsWith('transaction.')) {
      warnings.push(`Evento de Transbank no reconocido: ${webhookPayload.event}`);
    }
  }

  /**
   * Valida webhook de Stripe
   */
  private validateStripeWebhook(webhookPayload: PaymentWebhookPayload, errors: string[], warnings: string[]): void {
    if (!webhookPayload.data?.id) {
      errors.push('ID de Stripe es requerido');
    }

    if (webhookPayload.event && !webhookPayload.event.includes('.')) {
      warnings.push(`Formato de evento de Stripe inesperado: ${webhookPayload.event}`);
    }

    if (!webhookPayload.signature) {
      warnings.push('Firma del webhook de Stripe no presente, podría ser un riesgo de seguridad');
    }
  }

  /**
   * Valida credenciales de MercadoPago
   */
  private validateMercadoPagoCredentials(credentials: Record<string, any>, errors: string[], warnings: string[]): void {
    if (!credentials.accessToken) {
      errors.push('Access token de MercadoPago es requerido');
    } else if (!credentials.accessToken.startsWith('APP-')) {
      warnings.push('El access token de MercadoPago podría no tener el formato correcto');
    }

    if (!credentials.publicKey) {
      errors.push('Public key de MercadoPago es requerido');
    } else if (!credentials.publicKey.startsWith('TEST-') && !credentials.publicKey.startsWith('APP-')) {
      warnings.push('La public key de MercadoPago podría no tener el formato correcto');
    }
  }

  /**
   * Valida credenciales de Transbank
   */
  private validateTransbankCredentials(credentials: Record<string, any>, errors: string[], warnings: string[]): void {
    if (!credentials.apiKey) {
      errors.push('API key de Transbank es requerido');
    }

    if (!credentials.commerceCode) {
      errors.push('Commerce code de Transbank es requerido');
    } else if (credentials.commerceCode.length !== 12) {
      warnings.push('El commerce code de Transbank podría no tener el formato correcto (12 dígitos)');
    }
  }

  /**
   * Valida credenciales de Stripe
   */
  private validateStripeCredentials(credentials: Record<string, any>, errors: string[], warnings: string[]): void {
    if (!credentials.secretKey) {
      errors.push('Secret key de Stripe es requerido');
    } else if (!credentials.secretKey.startsWith('sk_')) {
      warnings.push('La secret key de Stripe podría no tener el formato correcto');
    }

    if (!credentials.publishableKey) {
      errors.push('Publishable key de Stripe es requerido');
    } else if (!credentials.publishableKey.startsWith('pk_')) {
      warnings.push('La publishable key de Stripe podría no tener el formato correcto');
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
   * Valida formato de teléfono
   */
  private isValidPhone(phone: string): boolean {
    // Formato básico: +56912345678 o 56912345678
    const phoneRegex = /^(\+?56)?9\d{8}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
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
}
