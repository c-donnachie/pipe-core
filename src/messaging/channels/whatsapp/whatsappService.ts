import { Injectable, Logger } from '@nestjs/common';
import { MessageRouter } from '../../messageRouter';
import { TwilioWhatsappAdapter } from './twilioAdapter';
import { MetaWhatsappAdapter } from './metaAdapter';
import { normalizePayload } from '../../utils/normalizePayload';
import { MessageResponse, MessageTemplate, MessageLog } from '../../interfaces';
import { MESSAGING_CONSTANTS } from '../../constants';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private messageLogs: MessageLog[] = [];
  private messageTemplates: MessageTemplate[] = [];

  constructor(
    private readonly messageRouter: MessageRouter,
    private readonly twilioAdapter: TwilioWhatsappAdapter,
    private readonly metaAdapter: MetaWhatsappAdapter,
  ) {}

  /**
   * Envía un mensaje WhatsApp
   */
  async sendWhatsAppMessage(
    tenantId: string,
    to: string,
    message: string,
    mediaUrls?: string[]
  ): Promise<MessageResponse> {
    try {
      this.logger.log(`Enviando WhatsApp para tenant ${tenantId} a ${to}`);

      // Obtener el proveedor configurado para este tenant
      const provider = await this.messageRouter.getProvider(tenantId, 'whatsapp');
      
      // Determinar qué adapter usar
      let adapter;
      if (provider.provider === 'twilio') {
        adapter = this.twilioAdapter;
      } else if (provider.provider === 'meta') {
        adapter = this.metaAdapter;
      } else {
        throw new Error(`Proveedor no soportado para WhatsApp: ${provider.provider}`);
      }

      // Normalizar el payload
      const payload = normalizePayload({ to, message, mediaUrls });

      // Enviar el mensaje
      let result;
      if (mediaUrls && mediaUrls.length > 0) {
        result = await adapter.sendMessageWithMedia(
          payload.to,
          payload.message,
          payload.mediaUrls || [],
          tenantId,
          provider
        );
      } else {
        result = await adapter.sendMessage(
          payload.to,
          payload.message,
          tenantId,
          provider
        );
      }

      // Log del mensaje
      await this.logMessage({
        tenantId,
        messageId: result.id,
        to: result.to,
        from: result.from,
        body: result.body,
        channel: 'whatsapp',
        status: result.status,
        direction: 'outbound',
        provider: provider.provider,
        mediaUrls: result.mediaUrls,
      });

      return result;
    } catch (error) {
      this.logger.error(`Error enviando WhatsApp: ${error.message}`);
      
      // Log del error
      await this.logMessage({
        tenantId,
        messageId: '',
        to,
        from: '',
        body: message,
        channel: 'whatsapp',
        status: 'failed',
        direction: 'outbound',
        errorMessage: error.message,
      });

      throw error;
    }
  }

  /**
   * Envía un mensaje WhatsApp usando una plantilla
   */
  async sendTemplateMessage(
    tenantId: string,
    templateId: string,
    to: string,
    templateParams: Record<string, any>
  ): Promise<MessageResponse> {
    try {
      this.logger.log(`Enviando WhatsApp con plantilla ${templateId} para tenant ${tenantId}`);

      const template = this.messageTemplates.find(
        t => t.id === templateId && t.tenantId === tenantId && t.isActive && t.channel === 'whatsapp'
      );

      if (!template) {
        throw new Error('Plantilla WhatsApp no encontrada o inactiva');
      }

      const processedMessage = this.processTemplate(template.content, templateParams);

      return this.sendWhatsAppMessage(tenantId, to, processedMessage);
    } catch (error) {
      this.logger.error(`Error enviando WhatsApp con plantilla: ${error.message}`);
      throw error;
    }
  }

  /**
   * Procesa mensajes WhatsApp entrantes
   */
  async processIncomingMessage(
    tenantId: string,
    webhookData: any,
    provider: 'twilio' | 'meta'
  ): Promise<void> {
    try {
      this.logger.log(`Procesando mensaje WhatsApp entrante para tenant ${tenantId}`);

      let processedData;
      
      if (provider === 'twilio') {
        processedData = await this.twilioAdapter.processWebhook(webhookData);
      } else if (provider === 'meta') {
        processedData = await this.metaAdapter.processWebhook(webhookData);
      } else {
        throw new Error(`Proveedor no soportado: ${provider}`);
      }

      if (!processedData) {
        return;
      }

      // Log del mensaje entrante
      await this.logMessage({
        tenantId,
        messageId: processedData.messageId,
        to: processedData.to,
        from: processedData.from,
        body: processedData.body,
        channel: 'whatsapp',
        status: 'received',
        direction: 'inbound',
        provider,
        mediaUrls: processedData.mediaUrls,
        webhookPayload: webhookData,
      });

      // Procesar respuestas automáticas
      await this.handleAutoResponse(tenantId, processedData);

    } catch (error) {
      this.logger.error(`Error procesando mensaje WhatsApp entrante: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crea una plantilla de WhatsApp
   */
  async createTemplate(templateData: Omit<MessageTemplate, 'id' | 'createdAt' | 'updatedAt' | 'channel'>): Promise<MessageTemplate> {
    const template: MessageTemplate = {
      id: this.generateId(),
      ...templateData,
      channel: 'whatsapp',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.messageTemplates.push(template);
    this.logger.log(`Plantilla WhatsApp creada: ${template.name} para tenant ${template.tenantId}`);

    return template;
  }

  /**
   * Obtiene plantillas WhatsApp por tenant
   */
  async getTemplatesByTenant(tenantId: string): Promise<MessageTemplate[]> {
    return this.messageTemplates.filter(t => t.tenantId === tenantId && t.isActive && t.channel === 'whatsapp');
  }

  /**
   * Obtiene logs de WhatsApp por tenant
   */
  async getLogsByTenant(tenantId: string, limit = 50): Promise<MessageLog[]> {
    return this.messageLogs
      .filter(log => log.tenantId === tenantId && log.channel === 'whatsapp')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  /**
   * Maneja respuestas automáticas a mensajes entrantes
   */
  private async handleAutoResponse(tenantId: string, messageData: any): Promise<void> {
    const messageBody = messageData.body?.toLowerCase() || '';
    
    // Respuestas automáticas básicas
    if (messageBody.includes('hola') || messageBody.includes('hi')) {
      await this.sendWhatsAppMessage(
        tenantId,
        messageData.from,
        '¡Hola! 👋 ¿En qué puedo ayudarte?'
      );
    } else if (messageBody.includes('menu') || messageBody.includes('carta')) {
      await this.sendWhatsAppMessage(
        tenantId,
        messageData.from,
        '📋 Aquí tienes nuestro menú: https://ejemplo.com/menu'
      );
    } else if (messageBody.includes('horario') || messageBody.includes('horarios')) {
      await this.sendWhatsAppMessage(
        tenantId,
        messageData.from,
        '🕒 Nuestros horarios: Lunes a Domingo de 9:00 AM a 10:00 PM'
      );
    }
  }

  /**
   * Procesa una plantilla reemplazando variables
   */
  private processTemplate(template: string, params: Record<string, any>): string {
    let processedTemplate = template;
    
    Object.entries(params).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processedTemplate = processedTemplate.replace(regex, String(value));
    });

    return processedTemplate;
  }

  /**
   * Registra un mensaje en los logs
   */
  private async logMessage(logData: Omit<MessageLog, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    const log: MessageLog = {
      id: this.generateId(),
      ...logData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.messageLogs.push(log);
    this.logger.log(`WhatsApp registrado: ${log.messageId} - ${log.status}`);
  }

  /**
   * Genera un ID único
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
