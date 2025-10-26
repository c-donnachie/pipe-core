import { Injectable, Logger } from '@nestjs/common';
import { WebhookConfig, WebhookEvent } from './interfaces';

@Injectable()
export class WebhookRouter {
  private readonly logger = new Logger(WebhookRouter.name);
  private webhookConfigs: Map<string, WebhookConfig[]> = new Map();
  private eventHandlers: Map<string, (event: WebhookEvent) => Promise<void>> = new Map();

  constructor() {
    this.initializeDefaultConfigs();
    this.initializeEventHandlers();
  }

  /**
   * Inicializa configuraciones por defecto
   */
  private initializeDefaultConfigs(): void {
    // Configuración por defecto para TableFlow
    this.webhookConfigs.set('tableflow_123', [
      {
        tenantId: 'tableflow_123',
        eventType: 'payment.completed',
        webhookUrl: 'https://tableflow-supabase.com/functions/v1/webhooks/payment',
        secret: process.env.TABLEFLOW_WEBHOOK_SECRET || 'tableflow_secret',
        isActive: true,
        retryAttempts: 3,
        timeout: 30000,
      },
      {
        tenantId: 'tableflow_123',
        eventType: 'delivery.completed',
        webhookUrl: 'https://tableflow-supabase.com/functions/v1/webhooks/delivery',
        secret: process.env.TABLEFLOW_WEBHOOK_SECRET || 'tableflow_secret',
        isActive: true,
        retryAttempts: 3,
        timeout: 30000,
      },
    ]);

    // Configuración por defecto para Genda
    this.webhookConfigs.set('genda_456', [
      {
        tenantId: 'genda_456',
        eventType: 'payment.completed',
        webhookUrl: 'https://genda-supabase.com/functions/v1/webhooks/payment',
        secret: process.env.GENDA_WEBHOOK_SECRET || 'genda_secret',
        isActive: true,
        retryAttempts: 3,
        timeout: 30000,
      },
    ]);

    // Configuración por defecto para ROE
    this.webhookConfigs.set('roe_789', [
      {
        tenantId: 'roe_789',
        eventType: 'payment.completed',
        webhookUrl: 'https://roe-supabase.com/functions/v1/webhooks/payment',
        secret: process.env.ROE_WEBHOOK_SECRET || 'roe_secret',
        isActive: true,
        retryAttempts: 3,
        timeout: 30000,
      },
      {
        tenantId: 'roe_789',
        eventType: 'delivery.completed',
        webhookUrl: 'https://roe-supabase.com/functions/v1/webhooks/delivery',
        secret: process.env.ROE_WEBHOOK_SECRET || 'roe_secret',
        isActive: true,
        retryAttempts: 3,
        timeout: 30000,
      },
    ]);

    this.logger.log(`Configuraciones de webhooks inicializadas para ${this.webhookConfigs.size} tenants`);
  }

  /**
   * Inicializa manejadores de eventos
   */
  private initializeEventHandlers(): void {
    // Manejador para eventos de pago
    this.eventHandlers.set('payment.completed', async (event: WebhookEvent) => {
      this.logger.log(`Procesando evento de pago completado: ${event.eventId}`);
      // Aquí se integraría con el módulo de pagos
    });

    this.eventHandlers.set('payment.failed', async (event: WebhookEvent) => {
      this.logger.log(`Procesando evento de pago fallido: ${event.eventId}`);
      // Aquí se integraría con el módulo de pagos
    });

    // Manejador para eventos de delivery
    this.eventHandlers.set('delivery.completed', async (event: WebhookEvent) => {
      this.logger.log(`Procesando evento de delivery completado: ${event.eventId}`);
      // Aquí se integraría con el módulo de deliveries
    });

    this.eventHandlers.set('delivery.failed', async (event: WebhookEvent) => {
      this.logger.log(`Procesando evento de delivery fallido: ${event.eventId}`);
      // Aquí se integraría con el módulo de deliveries
    });

    // Manejador para eventos de mensajería
    this.eventHandlers.set('message.delivered', async (event: WebhookEvent) => {
      this.logger.log(`Procesando evento de mensaje entregado: ${event.eventId}`);
      // Aquí se integraría con el módulo de messaging
    });

    this.eventHandlers.set('message.failed', async (event: WebhookEvent) => {
      this.logger.log(`Procesando evento de mensaje fallido: ${event.eventId}`);
      // Aquí se integraría con el módulo de messaging
    });

    this.logger.log(`${this.eventHandlers.size} manejadores de eventos inicializados`);
  }

  /**
   * Procesa un evento de webhook
   */
  async processEvent(event: WebhookEvent): Promise<void> {
    this.logger.log(`Procesando evento: ${event.eventType} para tenant: ${event.tenantId}`);

    // Ejecutar manejador interno si existe
    const handler = this.eventHandlers.get(event.eventType);
    if (handler) {
      await handler(event);
    }

    // Obtener configuraciones de webhook para el tenant
    const configs = this.webhookConfigs.get(event.tenantId) || [];
    const relevantConfigs = configs.filter(config => 
      config.isActive && config.eventType === event.eventType
    );

    if (relevantConfigs.length === 0) {
      this.logger.warn(`No hay configuraciones de webhook activas para evento ${event.eventType} en tenant ${event.tenantId}`);
      return;
    }

    // Enviar webhook a cada configuración relevante
    for (const config of relevantConfigs) {
      await this.sendWebhook(config, event);
    }
  }

  /**
   * Envía un webhook a una URL específica
   */
  private async sendWebhook(config: WebhookConfig, event: WebhookEvent): Promise<void> {
    this.logger.log(`Enviando webhook a ${config.webhookUrl} para evento ${event.eventType}`);

    try {
      const payload = {
        eventType: event.eventType,
        eventId: event.eventId,
        tenantId: event.tenantId,
        timestamp: event.timestamp,
        data: event.data,
        source: event.source,
      };

      // Generar firma del webhook
      const signature = this.generateSignature(JSON.stringify(payload), config.secret);

      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': event.eventType,
          'X-Webhook-Event-Id': event.eventId,
          'User-Agent': 'PipeCore-Webhook/1.0',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(config.timeout),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      this.logger.log(`Webhook enviado exitosamente a ${config.webhookUrl}`);

    } catch (error) {
      this.logger.error(`Error enviando webhook a ${config.webhookUrl}: ${error.message}`);
      throw error;
    }
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
    const configs = this.webhookConfigs.get(tenantId) || [];
    
    // Verificar si ya existe una configuración para este evento
    const existingIndex = configs.findIndex(config => config.eventType === eventType);
    
    const newConfig: WebhookConfig = {
      tenantId,
      eventType,
      webhookUrl,
      secret,
      isActive: options?.isActive ?? true,
      retryAttempts: options?.retryAttempts ?? 3,
      timeout: options?.timeout ?? 30000,
    };

    if (existingIndex >= 0) {
      configs[existingIndex] = newConfig;
    } else {
      configs.push(newConfig);
    }

    this.webhookConfigs.set(tenantId, configs);
    this.logger.log(`Webhook configurado para tenant ${tenantId}: ${eventType} -> ${webhookUrl}`);
  }

  /**
   * Obtiene configuraciones de webhook para un tenant
   */
  async getWebhookConfigs(tenantId: string, eventType?: string): Promise<WebhookConfig[]> {
    const configs = this.webhookConfigs.get(tenantId) || [];
    
    if (eventType) {
      return configs.filter(config => config.eventType === eventType);
    }
    
    return configs;
  }

  /**
   * Desactiva un webhook
   */
  async deactivateWebhook(tenantId: string, eventType: string): Promise<void> {
    const configs = this.webhookConfigs.get(tenantId) || [];
    const configIndex = configs.findIndex(config => config.eventType === eventType);
    
    if (configIndex >= 0) {
      configs[configIndex].isActive = false;
      this.logger.log(`Webhook desactivado para tenant ${tenantId}: ${eventType}`);
    } else {
      this.logger.warn(`Webhook no encontrado para desactivar: ${tenantId} - ${eventType}`);
    }
  }

  /**
   * Activa un webhook
   */
  async activateWebhook(tenantId: string, eventType: string): Promise<void> {
    const configs = this.webhookConfigs.get(tenantId) || [];
    const configIndex = configs.findIndex(config => config.eventType === eventType);
    
    if (configIndex >= 0) {
      configs[configIndex].isActive = true;
      this.logger.log(`Webhook activado para tenant ${tenantId}: ${eventType}`);
    } else {
      this.logger.warn(`Webhook no encontrado para activar: ${tenantId} - ${eventType}`);
    }
  }

  /**
   * Elimina una configuración de webhook
   */
  async removeWebhook(tenantId: string, eventType: string): Promise<void> {
    const configs = this.webhookConfigs.get(tenantId) || [];
    const filteredConfigs = configs.filter(config => config.eventType !== eventType);
    
    this.webhookConfigs.set(tenantId, filteredConfigs);
    this.logger.log(`Webhook eliminado para tenant ${tenantId}: ${eventType}`);
  }

  /**
   * Genera firma HMAC para el webhook
   */
  private generateSignature(payload: string, secret: string): string {
    const crypto = require('crypto');
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  /**
   * Valida firma de webhook entrante
   */
  validateSignature(payload: string, signature: string, secret: string): boolean {
    const crypto = require('crypto');
    const expectedSignature = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  /**
   * Obtiene estadísticas de webhooks
   */
  async getWebhookStats(tenantId: string): Promise<{
    totalConfigs: number;
    activeConfigs: number;
    inactiveConfigs: number;
    byEventType: Record<string, number>;
  }> {
    const configs = this.webhookConfigs.get(tenantId) || [];
    
    const stats = {
      totalConfigs: configs.length,
      activeConfigs: configs.filter(config => config.isActive).length,
      inactiveConfigs: configs.filter(config => !config.isActive).length,
      byEventType: {} as Record<string, number>,
    };

    configs.forEach(config => {
      stats.byEventType[config.eventType] = (stats.byEventType[config.eventType] || 0) + 1;
    });

    return stats;
  }

  /**
   * Obtiene tipos de eventos soportados
   */
  getSupportedEventTypes(): string[] {
    return [
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
  }

  /**
   * Registra un nuevo manejador de evento
   */
  registerEventHandler(eventType: string, handler: (event: WebhookEvent) => Promise<void>): void {
    this.eventHandlers.set(eventType, handler);
    this.logger.log(`Manejador de evento registrado: ${eventType}`);
  }

  /**
   * Elimina un manejador de evento
   */
  unregisterEventHandler(eventType: string): void {
    this.eventHandlers.delete(eventType);
    this.logger.log(`Manejador de evento eliminado: ${eventType}`);
  }
}
