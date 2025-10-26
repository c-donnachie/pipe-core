import { Injectable, Logger } from '@nestjs/common';
import { WebhookRouter } from './webhookRouter';
import { WebhookValidationService } from './services/webhookValidation.service';
import { WebhookLogService } from './services/webhookLog.service';
import { WebhookRetryService } from './services/webhookRetry.service';
import { 
  WebhookEvent, 
  WebhookConfig, 
  WebhookLog, 
  WebhookStats,
  CreateWebhookEventDto,
  WebhookValidationResult 
} from './interfaces';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly webhookRouter: WebhookRouter,
    private readonly webhookValidationService: WebhookValidationService,
    private readonly webhookLogService: WebhookLogService,
    private readonly webhookRetryService: WebhookRetryService,
  ) {}

  /**
   * Procesa un evento de webhook
   */
  async processEvent(createEventDto: CreateWebhookEventDto): Promise<void> {
    this.logger.log(`Procesando evento: ${createEventDto.eventType} para tenant: ${createEventDto.tenantId}`);

    // Crear evento
    const event: WebhookEvent = {
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      eventType: createEventDto.eventType,
      tenantId: createEventDto.tenantId,
      data: createEventDto.data,
      source: createEventDto.source || 'api',
      timestamp: new Date(),
    };

    // Validar evento
    const validationResult = await this.webhookValidationService.validateEvent(event);
    if (!validationResult.isValid) {
      throw new Error(`Evento inválido: ${validationResult.errors.join(', ')}`);
    }

    // Log del evento
    await this.webhookLogService.logEvent(event);

    try {
      // Procesar evento
      await this.webhookRouter.processEvent(event);
      
      // Log de éxito
      await this.webhookLogService.logWebhookDelivery({
        eventId: event.eventId,
        tenantId: event.tenantId,
        eventType: event.eventType,
        webhookUrl: 'internal',
        status: 'delivered',
        responseTime: 0,
        responseStatus: 200,
        deliveredAt: new Date(),
        retryCount: 0,
      });

      this.logger.log(`Evento procesado exitosamente: ${event.eventId}`);

    } catch (error) {
      this.logger.error(`Error procesando evento: ${error.message}`);
      
      // Log de error
      await this.webhookLogService.logWebhookDelivery({
        eventId: event.eventId,
        tenantId: event.tenantId,
        eventType: event.eventType,
        webhookUrl: 'internal',
        status: 'failed',
        responseTime: 0,
        responseStatus: 500,
        errorMessage: error.message,
        deliveredAt: new Date(),
        retryCount: 0,
      });

      // Programar reintento si es necesario
      await this.webhookRetryService.scheduleRetry(event, error.message);

      throw error;
    }
  }

  /**
   * Procesa webhook entrante de proveedor externo
   */
  async processIncomingWebhook(
    provider: string,
    eventType: string,
    payload: any,
    signature?: string,
    tenantId?: string
  ): Promise<void> {
    this.logger.log(`Procesando webhook entrante de ${provider}: ${eventType}`);

    // Validar webhook entrante
    const validationResult = await this.webhookValidationService.validateIncomingWebhook(
      provider,
      payload,
      signature
    );

    if (!validationResult.isValid) {
      throw new Error(`Webhook entrante inválido: ${validationResult.errors.join(', ')}`);
    }

    // Crear evento interno
    const event: WebhookEvent = {
      eventId: `ext_${provider}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      eventType: eventType,
      tenantId: tenantId || 'unknown',
      data: payload,
      source: provider,
      timestamp: new Date(),
    };

    // Procesar evento
    await this.processEvent({
      eventType: event.eventType,
      tenantId: event.tenantId,
      data: event.data,
      source: event.source,
    });
  }

  /**
   * Configura un webhook para un tenant
   */
  async configureWebhook(
    tenantId: string,
    eventType: string,
    webhookUrl: string,
    secret: string,
    options?: {
      retryAttempts?: number;
      timeout?: number;
      isActive?: boolean;
    }
  ): Promise<void> {
    this.logger.log(`Configurando webhook para tenant: ${tenantId}, evento: ${eventType}`);

    // Validar configuración
    const validationResult = await this.webhookValidationService.validateWebhookConfig({
      tenantId,
      eventType,
      webhookUrl,
      secret,
      isActive: options?.isActive ?? true,
      retryAttempts: options?.retryAttempts ?? 3,
      timeout: options?.timeout ?? 30000,
    });

    if (!validationResult.isValid) {
      throw new Error(`Configuración de webhook inválida: ${validationResult.errors.join(', ')}`);
    }

    // Configurar webhook
    await this.webhookRouter.configureWebhook(tenantId, eventType, webhookUrl, secret, options);

    this.logger.log(`Webhook configurado exitosamente para tenant: ${tenantId}`);
  }

  /**
   * Obtiene configuraciones de webhook de un tenant
   */
  async getWebhookConfigs(tenantId: string, eventType?: string): Promise<WebhookConfig[]> {
    this.logger.log(`Obteniendo configuraciones de webhook para tenant: ${tenantId}`);
    return await this.webhookRouter.getWebhookConfigs(tenantId, eventType);
  }

  /**
   * Activa un webhook
   */
  async activateWebhook(tenantId: string, eventType: string): Promise<void> {
    this.logger.log(`Activando webhook para tenant: ${tenantId}, evento: ${eventType}`);
    await this.webhookRouter.activateWebhook(tenantId, eventType);
  }

  /**
   * Desactiva un webhook
   */
  async deactivateWebhook(tenantId: string, eventType: string): Promise<void> {
    this.logger.log(`Desactivando webhook para tenant: ${tenantId}, evento: ${eventType}`);
    await this.webhookRouter.deactivateWebhook(tenantId, eventType);
  }

  /**
   * Elimina un webhook
   */
  async removeWebhook(tenantId: string, eventType: string): Promise<void> {
    this.logger.log(`Eliminando webhook para tenant: ${tenantId}, evento: ${eventType}`);
    await this.webhookRouter.removeWebhook(tenantId, eventType);
  }

  /**
   * Obtiene logs de webhooks de un tenant
   */
  async getWebhookLogs(
    tenantId: string,
    limit: number = 50,
    offset: number = 0,
    eventType?: string,
    status?: string
  ): Promise<WebhookLog[]> {
    this.logger.log(`Obteniendo logs de webhooks para tenant: ${tenantId}`);
    return await this.webhookLogService.getWebhookLogs(tenantId, limit, offset, eventType, status);
  }

  /**
   * Obtiene estadísticas de webhooks de un tenant
   */
  async getWebhookStats(tenantId: string, period?: 'day' | 'week' | 'month'): Promise<WebhookStats> {
    this.logger.log(`Obteniendo estadísticas de webhooks para tenant: ${tenantId}`);
    return await this.webhookLogService.getWebhookStats(tenantId, period);
  }

  /**
   * Reprocesa eventos fallidos
   */
  async reprocessFailedEvents(tenantId: string, eventType?: string): Promise<number> {
    this.logger.log(`Reprocesando eventos fallidos para tenant: ${tenantId}`);
    return await this.webhookRetryService.reprocessFailedEvents(tenantId, eventType);
  }

  /**
   * Obtiene eventos en cola de reintento
   */
  async getRetryQueue(tenantId: string, limit: number = 50): Promise<any[]> {
    this.logger.log(`Obteniendo cola de reintentos para tenant: ${tenantId}`);
    return await this.webhookRetryService.getRetryQueue(tenantId, limit);
  }

  /**
   * Limpia eventos antiguos de la cola de reintento
   */
  async cleanupRetryQueue(tenantId: string, olderThanHours: number = 24): Promise<number> {
    this.logger.log(`Limpiando cola de reintentos para tenant: ${tenantId}`);
    return await this.webhookRetryService.cleanupRetryQueue(tenantId, olderThanHours);
  }

  /**
   * Obtiene tipos de eventos soportados
   */
  getSupportedEventTypes(): string[] {
    return this.webhookRouter.getSupportedEventTypes();
  }

  /**
   * Registra un manejador de evento personalizado
   */
  registerEventHandler(eventType: string, handler: (event: WebhookEvent) => Promise<void>): void {
    this.webhookRouter.registerEventHandler(eventType, handler);
    this.logger.log(`Manejador de evento registrado: ${eventType}`);
  }

  /**
   * Elimina un manejador de evento
   */
  unregisterEventHandler(eventType: string): void {
    this.webhookRouter.unregisterEventHandler(eventType);
    this.logger.log(`Manejador de evento eliminado: ${eventType}`);
  }

  /**
   * Health check del servicio
   */
  async healthCheck(): Promise<{ status: string; timestamp: string; eventTypes: number }> {
    const supportedEventTypes = this.webhookRouter.getSupportedEventTypes();
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      eventTypes: supportedEventTypes.length,
    };
  }

  /**
   * Obtiene métricas de rendimiento
   */
  async getPerformanceMetrics(tenantId: string, period: 'hour' | 'day' | 'week'): Promise<{
    totalEvents: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    averageResponseTime: number;
    successRate: number;
    byEventType: Record<string, { count: number; successRate: number }>;
  }> {
    this.logger.log(`Obteniendo métricas de rendimiento para tenant: ${tenantId}`);
    return await this.webhookLogService.getPerformanceMetrics(tenantId, period);
  }

  /**
   * Valida una URL de webhook
   */
  async validateWebhookUrl(webhookUrl: string): Promise<WebhookValidationResult> {
    return await this.webhookValidationService.validateWebhookUrl(webhookUrl);
  }

  /**
   * Prueba un webhook
   */
  async testWebhook(
    tenantId: string,
    eventType: string,
    webhookUrl: string,
    secret: string
  ): Promise<{ success: boolean; responseTime: number; status: number; message?: string }> {
    this.logger.log(`Probando webhook: ${webhookUrl}`);

    try {
      const testEvent: WebhookEvent = {
        eventId: `test_${Date.now()}`,
        eventType,
        tenantId,
        data: { test: true, message: 'Webhook test from PipeCore' },
        source: 'test',
        timestamp: new Date(),
      };

      const payload = {
        eventType: testEvent.eventType,
        eventId: testEvent.eventId,
        tenantId: testEvent.tenantId,
        timestamp: testEvent.timestamp,
        data: testEvent.data,
        source: testEvent.source,
      };

      const crypto = require('crypto');
      const signature = crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');

      const startTime = Date.now();
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': eventType,
          'X-Webhook-Event-Id': testEvent.eventId,
          'User-Agent': 'PipeCore-Webhook/1.0',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000), // 10 segundos timeout para test
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        return {
          success: true,
          responseTime,
          status: response.status,
          message: 'Webhook test exitoso',
        };
      } else {
        return {
          success: false,
          responseTime,
          status: response.status,
          message: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

    } catch (error) {
      this.logger.error(`Error probando webhook: ${error.message}`);
      return {
        success: false,
        responseTime: 0,
        status: 0,
        message: error.message,
      };
    }
  }
}
