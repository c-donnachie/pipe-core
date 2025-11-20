import { Injectable, Logger } from '@nestjs/common';
import { MessageRouter } from '../../messageRouter';
import { SendgridEmailAdapter } from './sendgridAdapter';
import { ResendEmailAdapter } from './resendAdapter';
import { normalizePayload } from '../../utils/normalizePayload';
import { MessageResponse, MessageTemplate, MessageLog } from '../../interfaces';
import { MESSAGING_CONSTANTS } from '../../constants';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private messageLogs: MessageLog[] = [];
  private messageTemplates: MessageTemplate[] = [];

  constructor(
    private readonly messageRouter: MessageRouter,
    private readonly sendgridAdapter: SendgridEmailAdapter,
    private readonly resendAdapter: ResendEmailAdapter,
  ) {}

  /**
   * Envía un email
   */
  async sendEmailMessage(
    tenantId: string,
    to: string,
    subject: string,
    htmlContent: string,
    textContent: string,
    from: string,
    attachments?: any[]
  ): Promise<MessageResponse> {
    try {
      this.logger.log(`Enviando email para tenant ${tenantId} a ${to}`);

      // Obtener el proveedor configurado para este tenant
      const provider = await this.messageRouter.getProvider(tenantId, 'email');
      
      // Determinar qué adapter usar
      let adapter;
      if (provider.provider === 'sendgrid') {
        adapter = this.sendgridAdapter;
      } else if (provider.provider === 'resend') {
        adapter = this.resendAdapter;
      } else {
        throw new Error(`Proveedor no soportado para Email: ${provider.provider}`);
      }

      // Normalizar el payload
      const payload = normalizePayload({ to, subject, htmlContent, textContent, from });

      // Enviar el mensaje
      let result;
      if (attachments && attachments.length > 0) {
        result = await adapter.sendMessageWithAttachments(
          payload.to,
          payload.subject,
          payload.htmlContent,
          payload.textContent,
          payload.from,
          attachments,
          tenantId,
          provider
        );
      } else {
        result = await adapter.sendMessage(
          payload.to,
          payload.subject,
          payload.htmlContent,
          payload.textContent,
          payload.from,
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
        body: result.subject,
        channel: 'email',
        status: result.status,
        direction: 'outbound',
        provider: provider.provider,
      });

      return result;
    } catch (error) {
      this.logger.error(`Error enviando email: ${error.message}`);
      
      // Log del error
      await this.logMessage({
        tenantId,
        messageId: '',
        to,
        from: from || '',
        body: subject,
        channel: 'email',
        status: 'failed',
        direction: 'outbound',
        errorMessage: error.message,
      });

      throw error;
    }
  }

  /**
   * Envía un email usando una plantilla
   */
  async sendTemplateMessage(
    tenantId: string,
    templateId: string,
    to: string,
    templateParams: Record<string, any>
  ): Promise<MessageResponse> {
    try {
      this.logger.log(`Enviando email con plantilla ${templateId} para tenant ${tenantId}`);

      const template = this.messageTemplates.find(
        t => t.id === templateId && t.tenantId === tenantId && t.isActive && t.channel === 'email'
      );

      if (!template) {
        throw new Error('Plantilla Email no encontrada o inactiva');
      }

      // Para emails, necesitamos procesar tanto el subject como el content
      const processedSubject = this.processTemplate(template.content, templateParams);
      const processedHtml = template.content.includes('<') 
        ? this.processTemplate(template.content, templateParams)
        : `<html><body>${this.processTemplate(template.content, templateParams)}</body></html>`;
      const processedText = this.processTemplate(template.content, templateParams);

      return this.sendEmailMessage(
        tenantId,
        to,
        processedSubject,
        processedHtml,
        processedText,
        'noreply@pipecore.com'
      );
    } catch (error) {
      this.logger.error(`Error enviando email con plantilla: ${error.message}`);
      throw error;
    }
  }

  /**
   * Procesa eventos de email entrantes (bounces, opens, clicks)
   */
  async processIncomingEvent(
    tenantId: string,
    webhookData: any,
    provider: 'sendgrid' | 'resend'
  ): Promise<void> {
    try {
      this.logger.log(`Procesando evento email para tenant ${tenantId}`);

      let processedData;
      
      if (provider === 'sendgrid') {
        processedData = await this.sendgridAdapter.processWebhook(webhookData);
      } else if (provider === 'resend') {
        processedData = await this.resendAdapter.processWebhook(webhookData);
      } else {
        throw new Error(`Proveedor no soportado: ${provider}`);
      }

      if (!processedData) {
        return;
      }

      // Log del evento
      if (Array.isArray(processedData)) {
        // SendGrid puede enviar múltiples eventos
        for (const event of processedData) {
          await this.logMessage({
            tenantId,
            messageId: event.messageId,
            to: event.email,
            from: '',
            body: event.event,
            channel: 'email',
            status: event.event,
            direction: 'inbound',
            provider,
            webhookPayload: event,
          });
        }
      } else {
        // Resend envía un evento individual
        await this.logMessage({
          tenantId,
          messageId: processedData.messageId,
          to: processedData.email,
          from: '',
          body: processedData.event,
          channel: 'email',
          status: processedData.event,
          direction: 'inbound',
          provider,
          webhookPayload: processedData,
        });
      }

    } catch (error) {
      this.logger.error(`Error procesando evento email: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crea una plantilla de email
   */
  async createTemplate(templateData: Omit<MessageTemplate, 'id' | 'createdAt' | 'updatedAt' | 'channel'>): Promise<MessageTemplate> {
    const template: MessageTemplate = {
      id: this.generateId(),
      ...templateData,
      channel: 'email',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.messageTemplates.push(template);
    this.logger.log(`Plantilla Email creada: ${template.name} para tenant ${template.tenantId}`);

    return template;
  }

  /**
   * Obtiene plantillas Email por tenant
   */
  async getTemplatesByTenant(tenantId: string): Promise<MessageTemplate[]> {
    return this.messageTemplates.filter(t => t.tenantId === tenantId && t.isActive && t.channel === 'email');
  }

  /**
   * Obtiene logs de Email por tenant
   */
  async getLogsByTenant(tenantId: string, limit = 50): Promise<MessageLog[]> {
    return this.messageLogs
      .filter(log => log.tenantId === tenantId && log.channel === 'email')
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
    this.logger.log(`Email registrado: ${log.messageId} - ${log.status}`);
  }

  /**
   * Genera un ID único
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
