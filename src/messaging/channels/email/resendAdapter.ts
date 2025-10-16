import { Injectable, Logger } from '@nestjs/common';
import { ProviderConfig } from '../../messageRouter';

@Injectable()
export class ResendEmailAdapter {
  private readonly logger = new Logger(ResendEmailAdapter.name);

  /**
   * Envía un email usando Resend
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
      this.logger.log(`Enviando email via Resend para tenant ${tenantId} a ${to}`);

      const { apiKey, fromEmail } = providerConfig.credentials;

      if (!apiKey) {
        throw new Error('API Key de Resend no configurada');
      }

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: from || fromEmail || 'noreply@pipecore.com',
          to: [to],
          subject: subject,
          html: htmlContent,
          text: textContent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error Resend API: ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();

      this.logger.log(`Email enviado exitosamente via Resend: ${data.id}`);

      return {
        id: data.id,
        status: 'sent',
        provider: 'resend',
        channel: 'email',
        to: to,
        from: from || fromEmail || 'noreply@pipecore.com',
        subject: subject,
        sentAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Error enviando email via Resend: ${error.message}`);
      throw new Error(`Error Resend Email: ${error.message}`);
    }
  }

  /**
   * Envía un email con adjuntos usando Resend
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
      this.logger.log(`Enviando email con adjuntos via Resend para tenant ${tenantId} a ${to}`);

      const { apiKey, fromEmail } = providerConfig.credentials;

      if (!apiKey) {
        throw new Error('API Key de Resend no configurada');
      }

      // Procesar adjuntos para Resend
      const resendAttachments = attachments.map(attachment => ({
        filename: attachment.filename,
        content: attachment.content, // Base64 encoded
        path: attachment.path,
      }));

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: from || fromEmail || 'noreply@pipecore.com',
          to: [to],
          subject: subject,
          html: htmlContent,
          text: textContent,
          attachments: resendAttachments,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error Resend API: ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();

      this.logger.log(`Email con adjuntos enviado exitosamente via Resend: ${data.id}`);

      return {
        id: data.id,
        status: 'sent',
        provider: 'resend',
        channel: 'email',
        to: to,
        from: from || fromEmail || 'noreply@pipecore.com',
        subject: subject,
        sentAt: new Date(),
        attachments: attachments.length,
      };
    } catch (error) {
      this.logger.error(`Error enviando email con adjuntos via Resend: ${error.message}`);
      throw new Error(`Error Resend Email con adjuntos: ${error.message}`);
    }
  }

  /**
   * Procesa webhooks de Resend (bounces, opens, clicks)
   */
  async processWebhook(webhookData: any): Promise<any> {
    try {
      this.logger.log(`Procesando webhook Resend`);

      const event = webhookData;

      return {
        messageId: event.data?.email_id,
        event: event.type,
        email: event.data?.email,
        timestamp: new Date(),
        reason: event.data?.reason,
        url: event.data?.url,
      };
    } catch (error) {
      this.logger.error(`Error procesando webhook Resend: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene el estado de un email
   */
  async getEmailStatus(emailId: string, providerConfig: ProviderConfig): Promise<any> {
    try {
      const { apiKey } = providerConfig.credentials;

      if (!apiKey) {
        throw new Error('API Key de Resend no configurada');
      }

      const response = await fetch(`https://api.resend.com/emails/${emailId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error Resend API: ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();

      return {
        id: data.id,
        status: data.last_event,
        to: data.to,
        from: data.from,
        subject: data.subject,
        sentAt: new Date(data.created_at),
        lastEvent: data.last_event,
      };
    } catch (error) {
      this.logger.error(`Error obteniendo estado del email ${emailId}: ${error.message}`);
      throw error;
    }
  }
}
