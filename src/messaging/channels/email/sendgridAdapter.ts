import { Injectable, Logger } from '@nestjs/common';
import { ProviderConfig } from '../../messageRouter';

@Injectable()
export class SendgridEmailAdapter {
  private readonly logger = new Logger(SendgridEmailAdapter.name);

  /**
   * Envía un email usando SendGrid
   */
  async sendMessage(
    to: string,
    subject: string,
    htmlContent: string,
    textContent: string,
    from: string,
    tenantId: string,
    providerConfig: ProviderConfig
  ): Promise<any> {
    try {
      this.logger.log(`Enviando email via SendGrid para tenant ${tenantId} a ${to}`);

      const { apiKey, fromEmail } = providerConfig.credentials;

      if (!apiKey) {
        throw new Error('API Key de SendGrid no configurada');
      }

      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: to }],
              subject: subject,
            },
          ],
          from: {
            email: from || fromEmail || 'noreply@pipecore.com',
            name: 'PipeCore API',
          },
          content: [
            {
              type: 'text/html',
              value: htmlContent,
            },
            {
              type: 'text/plain',
              value: textContent,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error SendGrid API: ${JSON.stringify(errorData)}`);
      }

      const messageId = response.headers.get('x-message-id') || this.generateId();

      this.logger.log(`Email enviado exitosamente via SendGrid: ${messageId}`);

      return {
        id: messageId,
        status: 'sent',
        provider: 'sendgrid',
        channel: 'email',
        to: to,
        from: from || fromEmail || 'noreply@pipecore.com',
        subject: subject,
        sentAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Error enviando email via SendGrid: ${error.message}`);
      throw new Error(`Error SendGrid Email: ${error.message}`);
    }
  }

  /**
   * Envía un email con adjuntos usando SendGrid
   */
  async sendMessageWithAttachments(
    to: string,
    subject: string,
    htmlContent: string,
    textContent: string,
    from: string,
    attachments: any[],
    tenantId: string,
    providerConfig: ProviderConfig
  ): Promise<any> {
    try {
      this.logger.log(`Enviando email con adjuntos via SendGrid para tenant ${tenantId} a ${to}`);

      const { apiKey, fromEmail } = providerConfig.credentials;

      if (!apiKey) {
        throw new Error('API Key de SendGrid no configurada');
      }

      // Procesar adjuntos para SendGrid
      const sendgridAttachments = attachments.map(attachment => ({
        content: attachment.content, // Base64 encoded
        filename: attachment.filename,
        type: attachment.type,
        disposition: 'attachment',
      }));

      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: to }],
              subject: subject,
            },
          ],
          from: {
            email: from || fromEmail || 'noreply@pipecore.com',
            name: 'PipeCore API',
          },
          content: [
            {
              type: 'text/html',
              value: htmlContent,
            },
            {
              type: 'text/plain',
              value: textContent,
            },
          ],
          attachments: sendgridAttachments,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error SendGrid API: ${JSON.stringify(errorData)}`);
      }

      const messageId = response.headers.get('x-message-id') || this.generateId();

      this.logger.log(`Email con adjuntos enviado exitosamente via SendGrid: ${messageId}`);

      return {
        id: messageId,
        status: 'sent',
        provider: 'sendgrid',
        channel: 'email',
        to: to,
        from: from || fromEmail || 'noreply@pipecore.com',
        subject: subject,
        sentAt: new Date(),
        attachments: attachments.length,
      };
    } catch (error) {
      this.logger.error(`Error enviando email con adjuntos via SendGrid: ${error.message}`);
      throw new Error(`Error SendGrid Email con adjuntos: ${error.message}`);
    }
  }

  /**
   * Procesa webhooks de SendGrid (bounces, opens, clicks)
   */
  async processWebhook(webhookData: any): Promise<any> {
    try {
      this.logger.log(`Procesando webhook SendGrid`);

      const events = webhookData || [];
      const processedEvents = [];

      for (const event of events) {
        processedEvents.push({
          messageId: event.sg_message_id,
          event: event.event,
          email: event.email,
          timestamp: new Date(event.timestamp * 1000),
          reason: event.reason,
          url: event.url,
          userAgent: event.useragent,
          ip: event.ip,
        });
      }

      return processedEvents;
    } catch (error) {
      this.logger.error(`Error procesando webhook SendGrid: ${error.message}`);
      throw error;
    }
  }

  /**
   * Genera un ID único
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
