import { Injectable, Logger } from '@nestjs/common';
import { Twilio } from 'twilio';
import { MessageResponse } from '../../interfaces';
import { ProviderConfig } from '../../messageRouter';

@Injectable()
export class TwilioWhatsappAdapter {
  private readonly logger = new Logger(TwilioWhatsappAdapter.name);

  /**
   * Envía un mensaje WhatsApp usando Twilio
   */
  async sendMessage(
    to: string,
    message: string,
    tenantId: string,
    providerConfig: ProviderConfig
  ): Promise<MessageResponse> {
    try {
      this.logger.log(`Enviando WhatsApp via Twilio para tenant ${tenantId} a ${to}`);

      const { accountSid, authToken, whatsappNumber } = providerConfig.credentials;

      if (!accountSid || !authToken) {
        throw new Error('Credenciales de Twilio incompletas');
      }

      const client = new Twilio(accountSid, authToken);
      
      const whatsappFrom = whatsappNumber || 'whatsapp:+14155238886';
      const whatsappTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

      const response = await client.messages.create({
        from: whatsappFrom,
        to: whatsappTo,
        body: message,
      });

      this.logger.log(`WhatsApp enviado exitosamente via Twilio: ${response.sid}`);

      return {
        id: response.sid,
        status: response.status,
        provider: 'twilio',
        channel: 'whatsapp',
        to: response.to,
        from: response.from,
        body: response.body,
        sentAt: response.dateCreated,
        errorCode: response.errorCode,
        errorMessage: response.errorMessage,
      };
    } catch (error) {
      this.logger.error(`Error enviando WhatsApp via Twilio: ${error.message}`);
      throw new Error(`Error Twilio WhatsApp: ${error.message}`);
    }
  }

  /**
   * Envía un mensaje WhatsApp con medios adjuntos
   */
  async sendMessageWithMedia(
    to: string,
    message: string,
    mediaUrls: string[],
    tenantId: string,
    providerConfig: ProviderConfig
  ): Promise<MessageResponse> {
    try {
      this.logger.log(`Enviando WhatsApp con medios via Twilio para tenant ${tenantId} a ${to}`);

      const { accountSid, authToken, whatsappNumber } = providerConfig.credentials;

      if (!accountSid || !authToken) {
        throw new Error('Credenciales de Twilio incompletas');
      }

      const client = new Twilio(accountSid, authToken);
      
      const whatsappFrom = whatsappNumber || 'whatsapp:+14155238886';
      const whatsappTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

      const response = await client.messages.create({
        from: whatsappFrom,
        to: whatsappTo,
        body: message,
        mediaUrl: mediaUrls.slice(0, 10), // Twilio permite máximo 10 medios
      });

      this.logger.log(`WhatsApp con medios enviado exitosamente via Twilio: ${response.sid}`);

      return {
        id: response.sid,
        status: response.status,
        provider: 'twilio',
        channel: 'whatsapp',
        to: response.to,
        from: response.from,
        body: response.body,
        sentAt: response.dateCreated,
        mediaUrls,
        errorCode: response.errorCode,
        errorMessage: response.errorMessage,
      };
    } catch (error) {
      this.logger.error(`Error enviando WhatsApp con medios via Twilio: ${error.message}`);
      throw new Error(`Error Twilio WhatsApp con medios: ${error.message}`);
    }
  }

  /**
   * Procesa webhooks entrantes de Twilio WhatsApp
   */
  async processWebhook(webhookData: any): Promise<any> {
    try {
      this.logger.log(`Procesando webhook WhatsApp de Twilio: ${webhookData.MessageSid}`);

      return {
        messageId: webhookData.MessageSid,
        from: webhookData.From,
        to: webhookData.To,
        body: webhookData.Body,
        status: webhookData.MessageStatus,
        profileName: webhookData.ProfileName,
        waId: webhookData.WaId,
        mediaUrls: this.extractMediaUrls(webhookData),
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Error procesando webhook WhatsApp de Twilio: ${error.message}`);
      throw error;
    }
  }

  /**
   * Extrae URLs de medios del webhook de Twilio
   */
  private extractMediaUrls(webhookData: any): string[] {
    const mediaUrls: string[] = [];
    const numMedia = parseInt(webhookData.NumMedia || '0', 10);

    for (let i = 0; i < numMedia; i++) {
      const mediaUrl = webhookData[`MediaUrl${i}`];
      if (mediaUrl) {
        mediaUrls.push(mediaUrl);
      }
    }

    return mediaUrls;
  }

  /**
   * Verifica el estado de un mensaje
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
      this.logger.error(`Error obteniendo estado del mensaje ${messageId}: ${error.message}`);
      throw error;
    }
  }
}
