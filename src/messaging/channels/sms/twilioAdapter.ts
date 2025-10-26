import { Injectable, Logger } from '@nestjs/common';
import { Twilio } from 'twilio';
import { ProviderConfig } from '../../messageRouter';
import { env } from '../../../common/env';

@Injectable()
export class TwilioSmsAdapter {
  private readonly logger = new Logger(TwilioSmsAdapter.name);

  /**
   * Envía un mensaje SMS usando Twilio
   */
  async sendMessage(
    to: string,
    message: string,
    tenantId: string,
    providerConfig: ProviderConfig
  ): Promise<any> {
    try {
      this.logger.log(`Enviando SMS via Twilio para tenant ${tenantId} a ${to}`);

      const { accountSid, authToken, phoneNumber } = providerConfig.credentials;

      if (!accountSid || !authToken) {
        throw new Error('Credenciales de Twilio incompletas');
      }

      const client = new Twilio(accountSid, authToken);

      const response = await client.messages.create({
        from: phoneNumber || env.twilio.phoneNumber,
        to: to,
        body: message,
      });

      this.logger.log(`SMS enviado exitosamente via Twilio: ${response.sid}`);

      return {
        id: response.sid,
        status: response.status,
        provider: 'twilio',
        channel: 'sms',
        to: response.to,
        from: response.from,
        body: response.body,
        sentAt: response.dateCreated,
        errorCode: response.errorCode,
        errorMessage: response.errorMessage,
      };
    } catch (error) {
      this.logger.error(`Error enviando SMS via Twilio: ${error.message}`);
      throw new Error(`Error Twilio SMS: ${error.message}`);
    }
  }

  /**
   * Procesa webhooks entrantes de Twilio SMS
   */
  async processWebhook(webhookData: any): Promise<any> {
    try {
      this.logger.log(`Procesando webhook SMS de Twilio: ${webhookData.MessageSid}`);

      return {
        messageId: webhookData.MessageSid,
        from: webhookData.From,
        to: webhookData.To,
        body: webhookData.Body,
        status: webhookData.SmsStatus || webhookData.MessageStatus,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Error procesando webhook SMS de Twilio: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verifica el estado de un mensaje SMS
   */
  async getMessageStatus(messageId: string, providerConfig: ProviderConfig): Promise<any> {
    try {
      const { accountSid, authToken } = providerConfig.credentials;

      if (!accountSid || !authToken) {
        throw new Error('Credenciales de Twilio incompletas');
      }

      const client = new Twilio(accountSid, authToken);
      const message = await client.messages(messageId).fetch();

      return {
        id: message.sid,
        status: message.status,
        to: message.to,
        from: message.from,
        body: message.body,
        sentAt: message.dateCreated,
        updatedAt: message.dateUpdated,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage,
      };
    } catch (error) {
      this.logger.error(`Error obteniendo estado del mensaje SMS ${messageId}: ${error.message}`);
      throw error;
    }
  }
}
