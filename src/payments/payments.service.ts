import { Injectable, Logger } from '@nestjs/common';
import { PaymentRouter } from './paymentRouter';
import { PaymentValidationService } from './services/paymentValidation.service';
import { PaymentLogService } from './services/paymentLog.service';
import { 
  CreatePaymentDto, 
  PaymentResponse, 
  PaymentStatus, 
  PaymentWebhookPayload,
  PaymentLog,
  PaymentStats 
} from './interfaces';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly paymentRouter: PaymentRouter,
    private readonly paymentValidationService: PaymentValidationService,
    private readonly paymentLogService: PaymentLogService,
  ) {}

  /**
   * Crea un nuevo pago
   */
  async createPayment(createPaymentDto: CreatePaymentDto): Promise<PaymentResponse> {
    this.logger.log(`Creando pago para tenant: ${createPaymentDto.tenantId}, monto: ${createPaymentDto.amount}`);

    // Validar datos del pago
    const validationResult = await this.paymentValidationService.validatePayment(createPaymentDto);
    if (!validationResult.isValid) {
      throw new Error(`Datos de pago inválidos: ${validationResult.errors.join(', ')}`);
    }

    // Obtener proveedor de pagos
    const paymentProvider = await this.paymentRouter.getPaymentProvider(
      createPaymentDto.tenantId,
      createPaymentDto.amount,
      createPaymentDto.currency
    );

    if (!paymentProvider) {
      throw new Error(`No hay proveedor de pagos configurado para tenant: ${createPaymentDto.tenantId}`);
    }

    try {
      // Crear pago con el proveedor
      const paymentResponse = await paymentProvider.createPayment(createPaymentDto);
      
      // Log del pago
      await this.paymentLogService.logPayment({
        tenantId: createPaymentDto.tenantId,
        paymentId: paymentResponse.paymentId,
        amount: createPaymentDto.amount,
        currency: createPaymentDto.currency,
        status: 'pending',
        provider: paymentResponse.provider,
        providerPaymentId: paymentResponse.providerPaymentId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      this.logger.log(`Pago creado exitosamente: ${paymentResponse.paymentId}`);
      return paymentResponse;

    } catch (error) {
      this.logger.error(`Error creando pago: ${error.message}`);
      
      // Log del error
      await this.paymentLogService.logPayment({
        tenantId: createPaymentDto.tenantId,
        paymentId: `error_${Date.now()}`,
        amount: createPaymentDto.amount,
        currency: createPaymentDto.currency,
        status: 'failed',
        provider: 'unknown',
        providerPaymentId: null,
        errorMessage: error.message,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      throw error;
    }
  }

  /**
   * Obtiene el estado de un pago
   */
  async getPaymentStatus(tenantId: string, paymentId: string): Promise<PaymentStatus> {
    this.logger.log(`Obteniendo estado de pago: ${paymentId} para tenant: ${tenantId}`);

    // Obtener log del pago
    const paymentLog = await this.paymentLogService.getPaymentLog(tenantId, paymentId);
    if (!paymentLog) {
      throw new Error(`Pago no encontrado: ${paymentId}`);
    }

    // Obtener proveedor de pagos
    const paymentProvider = await this.paymentRouter.getPaymentProvider(tenantId);
    if (!paymentProvider) {
      throw new Error(`No hay proveedor de pagos configurado para tenant: ${tenantId}`);
    }

    try {
      // Consultar estado en el proveedor
      const status = await paymentProvider.getPaymentStatus(paymentId, paymentLog.providerPaymentId);
      
      // Actualizar log si el estado cambió
      if (status.status !== paymentLog.status) {
        await this.paymentLogService.updatePaymentStatus(paymentId, status.status, status.message);
      }

      return status;

    } catch (error) {
      this.logger.error(`Error obteniendo estado de pago: ${error.message}`);
      throw error;
    }
  }

  /**
   * Procesa webhook de pago
   */
  async processWebhook(tenantId: string, provider: string, webhookPayload: PaymentWebhookPayload): Promise<void> {
    this.logger.log(`Procesando webhook de ${provider} para tenant: ${tenantId}`);

    // Validar webhook
    const validationResult = await this.paymentValidationService.validateWebhook(provider, webhookPayload);
    if (!validationResult.isValid) {
      throw new Error(`Webhook inválido: ${validationResult.errors.join(', ')}`);
    }

    // Obtener proveedor de pagos
    const paymentProvider = await this.paymentRouter.getPaymentProvider(tenantId);
    if (!paymentProvider) {
      throw new Error(`No hay proveedor de pagos configurado para tenant: ${tenantId}`);
    }

    try {
      // Procesar webhook con el proveedor
      const webhookResult = await paymentProvider.processWebhook(webhookPayload);
      
      // Actualizar log del pago
      if (webhookResult.paymentId && webhookResult.status) {
        await this.paymentLogService.updatePaymentStatus(
          webhookResult.paymentId, 
          webhookResult.status, 
          webhookResult.message
        );
      }

      // Log del webhook
      await this.paymentLogService.logWebhook({
        tenantId,
        provider,
        event: webhookPayload.event || 'unknown',
        paymentId: webhookResult.paymentId,
        status: webhookResult.status || 'processed',
        payload: webhookPayload,
        receivedAt: new Date(),
        processedAt: new Date(),
      });

      this.logger.log(`Webhook procesado exitosamente para pago: ${webhookResult.paymentId}`);

    } catch (error) {
      this.logger.error(`Error procesando webhook: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cancela un pago
   */
  async cancelPayment(tenantId: string, paymentId: string, reason?: string): Promise<PaymentResponse> {
    this.logger.log(`Cancelando pago: ${paymentId} para tenant: ${tenantId}`);

    // Obtener log del pago
    const paymentLog = await this.paymentLogService.getPaymentLog(tenantId, paymentId);
    if (!paymentLog) {
      throw new Error(`Pago no encontrado: ${paymentId}`);
    }

    // Verificar que el pago se puede cancelar
    if (!['pending', 'processing'].includes(paymentLog.status)) {
      throw new Error(`No se puede cancelar un pago con estado: ${paymentLog.status}`);
    }

    // Obtener proveedor de pagos
    const paymentProvider = await this.paymentRouter.getPaymentProvider(tenantId);
    if (!paymentProvider) {
      throw new Error(`No hay proveedor de pagos configurado para tenant: ${tenantId}`);
    }

    try {
      // Cancelar pago con el proveedor
      const cancelResponse = await paymentProvider.cancelPayment(paymentId, paymentLog.providerPaymentId, reason);
      
      // Actualizar log del pago
      await this.paymentLogService.updatePaymentStatus(paymentId, 'cancelled', reason || 'Cancelled by user');

      this.logger.log(`Pago cancelado exitosamente: ${paymentId}`);
      return cancelResponse;

    } catch (error) {
      this.logger.error(`Error cancelando pago: ${error.message}`);
      throw error;
    }
  }

  /**
   * Reembolsa un pago
   */
  async refundPayment(tenantId: string, paymentId: string, amount?: number, reason?: string): Promise<PaymentResponse> {
    this.logger.log(`Reembolsando pago: ${paymentId} para tenant: ${tenantId}`);

    // Obtener log del pago
    const paymentLog = await this.paymentLogService.getPaymentLog(tenantId, paymentId);
    if (!paymentLog) {
      throw new Error(`Pago no encontrado: ${paymentId}`);
    }

    // Verificar que el pago se puede reembolsar
    if (paymentLog.status !== 'completed') {
      throw new Error(`Solo se pueden reembolsar pagos completados. Estado actual: ${paymentLog.status}`);
    }

    // Obtener proveedor de pagos
    const paymentProvider = await this.paymentRouter.getPaymentProvider(tenantId);
    if (!paymentProvider) {
      throw new Error(`No hay proveedor de pagos configurado para tenant: ${tenantId}`);
    }

    try {
      // Reembolsar pago con el proveedor
      const refundResponse = await paymentProvider.refundPayment(
        paymentId, 
        paymentLog.providerPaymentId, 
        amount || paymentLog.amount,
        reason
      );
      
      // Log del reembolso
      await this.paymentLogService.logRefund({
        tenantId,
        originalPaymentId: paymentId,
        refundId: refundResponse.paymentId,
        amount: amount || paymentLog.amount,
        currency: paymentLog.currency,
        reason: reason || 'Refund requested',
        status: 'pending',
        createdAt: new Date(),
      });

      this.logger.log(`Reembolso iniciado exitosamente: ${refundResponse.paymentId}`);
      return refundResponse;

    } catch (error) {
      this.logger.error(`Error reembolsando pago: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene logs de pagos de un tenant
   */
  async getPaymentLogs(
    tenantId: string, 
    limit: number = 50, 
    offset: number = 0,
    status?: string,
    provider?: string
  ): Promise<PaymentLog[]> {
    this.logger.log(`Obteniendo logs de pagos para tenant: ${tenantId}`);
    return await this.paymentLogService.getPaymentLogs(tenantId, limit, offset, status, provider);
  }

  /**
   * Obtiene estadísticas de pagos de un tenant
   */
  async getPaymentStats(tenantId: string, period?: 'day' | 'week' | 'month'): Promise<PaymentStats> {
    this.logger.log(`Obteniendo estadísticas de pagos para tenant: ${tenantId}`);
    return await this.paymentLogService.getPaymentStats(tenantId, period);
  }

  /**
   * Configura un proveedor de pagos para un tenant
   */
  async configurePaymentProvider(
    tenantId: string, 
    provider: string, 
    credentials: Record<string, any>
  ): Promise<void> {
    this.logger.log(`Configurando proveedor ${provider} para tenant: ${tenantId}`);
    
    // Validar credenciales
    const validationResult = await this.paymentValidationService.validateCredentials(provider, credentials);
    if (!validationResult.isValid) {
      throw new Error(`Credenciales inválidas: ${validationResult.errors.join(', ')}`);
    }

    // Configurar proveedor
    await this.paymentRouter.setPaymentProvider(tenantId, provider, credentials);
    
    this.logger.log(`Proveedor ${provider} configurado exitosamente para tenant: ${tenantId}`);
  }

  /**
   * Health check del servicio
   */
  async healthCheck(): Promise<{ status: string; timestamp: string; providers: number }> {
    const availableProviders = this.paymentRouter.getAvailableProviders();
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      providers: availableProviders.length,
    };
  }
}
