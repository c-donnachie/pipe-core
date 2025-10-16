import { Injectable, Logger } from '@nestjs/common';
import { MessageRouter } from '../../messageRouter';
import { TwilioSmsAdapter } from './twilioAdapter';
import { normalizePayload } from '../../utils/normalizePayload';
import { MessageResponse, MessageTemplate, MessageLog } from '../../interfaces';
import { MESSAGING_CONSTANTS } from '../../constants';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private messageLogs: MessageLog[] = [];
  private messageTemplates: MessageTemplate[] = [];

  constructor(
    private readonly messageRouter: MessageRouter,
    private readonly twilioAdapter: TwilioSmsAdapter,
  ) {}

  /**
   * Envía un mensaje SMS
   */
  async sendSmsMessage(
    tenantId: string,
    to: string,
    message: string
  ): Promise<MessageResponse> {
    try {
      this.logger.log(`Enviando SMS para tenant ${tenantId} a ${to}`);

      // Obtener el proveedor configurado para este tenant
      const provider = await this.messageRouter.getProvider(tenantId, 'sms');
      
      // Determinar qué adapter usar
      let adapter;
      if (provider.provider === 'twilio') {
        adapter = this.twilioAdapter;
      } else {
        throw new Error(`Proveedor no soportado para SMS: ${provider.provider}`);
      }

      // Normalizar el payload
      const payload = normalizePayload({ to, message });

      // Enviar el mensaje
      const result = await adapter.sendMessage(
        payload.to,
        payload.message,
        tenantId,
        provider
      );

      // Log del mensaje
      await this.logMessage({
        tenantId,
        messageId: result.id,
        to: result.to,
        from: result.from,
        body: result.body,
        channel: 'sms',
        status: result.status,
        direction: 'outbound',
        provider: provider.provider,
      });

      return result;
    } catch (error) {
      this.logger.error(`Error enviando SMS: ${error.message}`);
      
      // Log del error
      await this.logMessage({
        tenantId,
        messageId: '',
        to,
        from: '',
        body: message,
        channel: 'sms',
        status: 'failed',
        direction: 'outbound',
        errorMessage: error.message,
      });

      throw error;
    }
  }

  /**
   * Envía un mensaje SMS usando una plantilla
   */
  async sendTemplateMessage(
    tenantId: string,
    templateId: string,
    to: string,
    templateParams: Record<string, any>
  ): Promise<MessageResponse> {
    try {
      this.logger.log(`Enviando SMS con plantilla ${templateId} para tenant ${tenantId}`);

      const template = this.messageTemplates.find(
        t => t.id === templateId && t.tenantId === tenantId && t.isActive && t.channel === 'sms'
      );

      if (!template) {
        throw new Error('Plantilla SMS no encontrada o inactiva');
      }

      const processedMessage = this.processTemplate(template.content, templateParams);

      return this.sendSmsMessage(tenantId, to, processedMessage);
    } catch (error) {
      this.logger.error(`Error enviando SMS con plantilla: ${error.message}`);
      throw error;
    }
  }

  /**
   * Procesa mensajes SMS entrantes
   */
  async processIncomingMessage(
    tenantId: string,
    webhookData: any,
    provider: 'twilio'
  ): Promise<void> {
    try {
      this.logger.log(`Procesando mensaje SMS entrante para tenant ${tenantId}`);

      let processedData;
      
      if (provider === 'twilio') {
        processedData = await this.twilioAdapter.processWebhook(webhookData);
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
        channel: 'sms',
        status: 'received',
        direction: 'inbound',
        provider,
        webhookPayload: webhookData,
      });

    } catch (error) {
      this.logger.error(`Error procesando mensaje SMS entrante: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crea una plantilla de SMS
   */
  async createTemplate(templateData: Omit<MessageTemplate, 'id' | 'createdAt' | 'updatedAt' | 'channel'>): Promise<MessageTemplate> {
    const template: MessageTemplate = {
      id: this.generateId(),
      ...templateData,
      channel: 'sms',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.messageTemplates.push(template);
    this.logger.log(`Plantilla SMS creada: ${template.name} para tenant ${template.tenantId}`);

    return template;
  }

  /**
   * Obtiene plantillas SMS por tenant
   */
  async getTemplatesByTenant(tenantId: string): Promise<MessageTemplate[]> {
    return this.messageTemplates.filter(t => t.tenantId === tenantId && t.isActive && t.channel === 'sms');
  }

  /**
   * Obtiene logs de SMS por tenant
   */
  async getLogsByTenant(tenantId: string, limit = 50): Promise<MessageLog[]> {
    return this.messageLogs
      .filter(log => log.tenantId === tenantId && log.channel === 'sms')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
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
    this.logger.log(`SMS registrado: ${log.messageId} - ${log.status}`);
  }

  /**
   * Genera un ID único
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
