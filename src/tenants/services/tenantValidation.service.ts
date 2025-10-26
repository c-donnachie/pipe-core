import { Injectable, Logger } from '@nestjs/common';
import { CreateTenantDto, UpdateTenantDto, TenantValidationResult } from '../interfaces';

@Injectable()
export class TenantValidationService {
  private readonly logger = new Logger(TenantValidationService.name);

  /**
   * Valida los datos de creación de un tenant
   */
  async validateTenantData(createTenantDto: CreateTenantDto): Promise<TenantValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validar nombre
    if (!createTenantDto.name || createTenantDto.name.trim().length === 0) {
      errors.push('El nombre del tenant es requerido');
    } else if (createTenantDto.name.length < 3) {
      errors.push('El nombre del tenant debe tener al menos 3 caracteres');
    } else if (createTenantDto.name.length > 100) {
      errors.push('El nombre del tenant no puede exceder 100 caracteres');
    }

    // Validar caracteres especiales en el nombre
    if (createTenantDto.name && !/^[a-zA-Z0-9\s\-_]+$/.test(createTenantDto.name)) {
      errors.push('El nombre del tenant solo puede contener letras, números, espacios, guiones y guiones bajos');
    }

    // Validar descripción
    if (createTenantDto.description && createTenantDto.description.length > 500) {
      errors.push('La descripción del tenant no puede exceder 500 caracteres');
    }

    // Validar configuración de mensajería
    if (createTenantDto.settings?.messaging) {
      const messagingValidation = this.validateMessagingSettings(createTenantDto.settings.messaging);
      errors.push(...messagingValidation.errors);
      warnings.push(...messagingValidation.warnings);
    }

    // Validar configuración de pagos
    if (createTenantDto.settings?.payments) {
      const paymentsValidation = this.validatePaymentsSettings(createTenantDto.settings.payments);
      errors.push(...paymentsValidation.errors);
      warnings.push(...paymentsValidation.warnings);
    }

    // Validar configuración de delivery
    if (createTenantDto.settings?.delivery) {
      const deliveryValidation = this.validateDeliverySettings(createTenantDto.settings.delivery);
      errors.push(...deliveryValidation.errors);
      warnings.push(...deliveryValidation.warnings);
    }

    // Validar límites
    if (createTenantDto.settings?.limits) {
      const limitsValidation = this.validateLimitsSettings(createTenantDto.settings.limits);
      errors.push(...limitsValidation.errors);
      warnings.push(...limitsValidation.warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Valida los datos de actualización de un tenant
   */
  async validateTenantUpdate(tenantId: string, updateTenantDto: UpdateTenantDto): Promise<TenantValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validar que el tenant existe
    if (!tenantId || tenantId.trim().length === 0) {
      errors.push('El ID del tenant es requerido');
    }

    // Validar nombre si se proporciona
    if (updateTenantDto.name !== undefined) {
      if (!updateTenantDto.name || updateTenantDto.name.trim().length === 0) {
        errors.push('El nombre del tenant no puede estar vacío');
      } else if (updateTenantDto.name.length < 3) {
        errors.push('El nombre del tenant debe tener al menos 3 caracteres');
      } else if (updateTenantDto.name.length > 100) {
        errors.push('El nombre del tenant no puede exceder 100 caracteres');
      }
    }

    // Validar descripción si se proporciona
    if (updateTenantDto.description !== undefined && updateTenantDto.description && updateTenantDto.description.length > 500) {
      errors.push('La descripción del tenant no puede exceder 500 caracteres');
    }

    // Validar estado si se proporciona
    if (updateTenantDto.status && !['active', 'inactive', 'suspended'].includes(updateTenantDto.status)) {
      errors.push('El estado del tenant debe ser: active, inactive o suspended');
    }

    // Validar configuraciones si se proporcionan
    if (updateTenantDto.settings) {
      if (updateTenantDto.settings.messaging) {
        const messagingValidation = this.validateMessagingSettings(updateTenantDto.settings.messaging);
        errors.push(...messagingValidation.errors);
        warnings.push(...messagingValidation.warnings);
      }

      if (updateTenantDto.settings.payments) {
        const paymentsValidation = this.validatePaymentsSettings(updateTenantDto.settings.payments);
        errors.push(...paymentsValidation.errors);
        warnings.push(...paymentsValidation.warnings);
      }

      if (updateTenantDto.settings.delivery) {
        const deliveryValidation = this.validateDeliverySettings(updateTenantDto.settings.delivery);
        errors.push(...deliveryValidation.errors);
        warnings.push(...deliveryValidation.warnings);
      }

      if (updateTenantDto.settings.limits) {
        const limitsValidation = this.validateLimitsSettings(updateTenantDto.settings.limits);
        errors.push(...limitsValidation.errors);
        warnings.push(...limitsValidation.warnings);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Valida credenciales de un proveedor
   */
  async validateCredentials(provider: string, credentials: Record<string, any>): Promise<TenantValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validar proveedor
    const validProviders = ['twilio', 'meta', 'sendgrid', 'resend', 'mercadopago', 'transbank', 'stripe', 'uber', 'rappi', 'pedidosya'];
    if (!validProviders.includes(provider)) {
      errors.push(`Proveedor no válido: ${provider}. Proveedores válidos: ${validProviders.join(', ')}`);
    }

    // Validar campos requeridos según el proveedor
    switch (provider) {
      case 'twilio':
        if (!credentials.apiKey) errors.push('apiKey es requerido para Twilio');
        if (!credentials.secretKey) errors.push('secretKey es requerido para Twilio');
        break;
      
      case 'meta':
        if (!credentials.apiKey) errors.push('accessToken es requerido para Meta');
        break;
      
      case 'sendgrid':
      case 'resend':
        if (!credentials.apiKey) errors.push('apiKey es requerido para el proveedor de email');
        if (!credentials.fromEmail) warnings.push('fromEmail recomendado para el proveedor de email');
        break;
      
      case 'mercadopago':
      case 'transbank':
      case 'stripe':
        if (!credentials.apiKey) errors.push('apiKey es requerido para el proveedor de pagos');
        if (!credentials.secretKey) errors.push('secretKey es requerido para el proveedor de pagos');
        break;
      
      case 'uber':
      case 'rappi':
      case 'pedidosya':
        if (!credentials.apiKey) errors.push('apiKey es requerido para el proveedor de delivery');
        break;
    }

    // Validar formato de email si se proporciona
    if (credentials.fromEmail && !this.isValidEmail(credentials.fromEmail)) {
      errors.push('El formato del email no es válido');
    }

    // Validar formato de teléfono si se proporciona
    if (credentials.fromPhone && !this.isValidPhone(credentials.fromPhone)) {
      warnings.push('El formato del teléfono podría no ser válido');
    }

    // Validar URL de webhook si se proporciona
    if (credentials.webhookUrl && !this.isValidUrl(credentials.webhookUrl)) {
      errors.push('La URL del webhook no es válida');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Valida configuración de mensajería
   */
  private validateMessagingSettings(settings: any): TenantValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (settings.defaultProvider && !['twilio', 'meta', 'sendgrid', 'resend'].includes(settings.defaultProvider)) {
      errors.push('Proveedor de mensajería no válido');
    }

    if (settings.retryAttempts && (settings.retryAttempts < 1 || settings.retryAttempts > 10)) {
      errors.push('Los intentos de reintento deben estar entre 1 y 10');
    }

    if (settings.timeout && (settings.timeout < 5000 || settings.timeout > 120000)) {
      warnings.push('El timeout recomendado está entre 5 y 120 segundos');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Valida configuración de pagos
   */
  private validatePaymentsSettings(settings: any): TenantValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (settings.defaultProvider && !['mercadopago', 'transbank', 'stripe'].includes(settings.defaultProvider)) {
      errors.push('Proveedor de pagos no válido');
    }

    if (settings.currency && !['CLP', 'USD', 'EUR', 'ARS', 'MXN'].includes(settings.currency)) {
      warnings.push('Moneda no reconocida, verificar compatibilidad');
    }

    if (settings.retryAttempts && (settings.retryAttempts < 1 || settings.retryAttempts > 5)) {
      errors.push('Los intentos de reintento para pagos deben estar entre 1 y 5');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Valida configuración de delivery
   */
  private validateDeliverySettings(settings: any): TenantValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (settings.defaultProvider && !['uber', 'rappi', 'pedidosya'].includes(settings.defaultProvider)) {
      errors.push('Proveedor de delivery no válido');
    }

    if (settings.retryAttempts && (settings.retryAttempts < 1 || settings.retryAttempts > 5)) {
      errors.push('Los intentos de reintento para delivery deben estar entre 1 y 5');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Valida configuración de límites
   */
  private validateLimitsSettings(settings: any): TenantValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (settings.maxMessagesPerDay && settings.maxMessagesPerDay < 100) {
      warnings.push('Límite de mensajes por día muy bajo, podría afectar el funcionamiento');
    }

    if (settings.maxMessagesPerDay && settings.maxMessagesPerDay > 100000) {
      warnings.push('Límite de mensajes por día muy alto, verificar costos');
    }

    if (settings.maxPaymentsPerDay && settings.maxPaymentsPerDay < 10) {
      warnings.push('Límite de pagos por día muy bajo');
    }

    if (settings.maxDeliveryRequestsPerDay && settings.maxDeliveryRequestsPerDay < 5) {
      warnings.push('Límite de requests de delivery por día muy bajo');
    }

    return { isValid: errors.length === 0, errors, warnings };
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

  /**
   * Valida que un tenant pueda ser eliminado
   */
  async validateTenantDeletion(tenantId: string): Promise<TenantValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Aquí se implementarían validaciones adicionales como:
    // - Verificar si hay transacciones pendientes
    // - Verificar si hay mensajes en cola
    // - Verificar si hay suscripciones activas
    
    warnings.push('Esta acción eliminará permanentemente el tenant y todos sus datos');
    warnings.push('Se recomienda hacer backup antes de proceder');

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
