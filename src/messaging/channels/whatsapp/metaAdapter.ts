import { Injectable, Logger } from '@nestjs/common';
import { ProviderConfig } from '../../messageRouter';

@Injectable()
export class MetaWhatsappAdapter {
  private readonly logger = new Logger(MetaWhatsappAdapter.name);

  /**
   * Envía un mensaje WhatsApp usando Meta API
   */
  async sendMessage(
    to: string,
    message: string,
    tenantId: string,
    providerConfig: ProviderConfig
  ): Promise<any> {
    try {
      this.logger.log(`Enviando WhatsApp via Meta para tenant ${tenantId} a ${to}`);

      const { accessToken, phoneNumberId } = providerConfig.credentials;

      if (!accessToken || !phoneNumberId) {
        throw new Error('Credenciales de Meta incompletas');
      }

      // Limpiar el número de teléfono
      const cleanTo = to.replace(/\D/g, '');
      
      const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: cleanTo,
          type: 'text',
          text: {
            body: message,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error Meta API: ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();

      this.logger.log(`WhatsApp enviado exitosamente via Meta: ${data.messages[0].id}`);

      return {
        id: data.messages[0].id,
        status: 'sent',
        provider: 'meta',
        channel: 'whatsapp',
        to: `whatsapp:+${cleanTo}`,
        from: `whatsapp:${phoneNumberId}`,
        body: message,
        sentAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Error enviando WhatsApp via Meta: ${error.message}`);
      throw new Error(`Error Meta WhatsApp: ${error.message}`);
    }
  }

  /**
   * Envía un mensaje WhatsApp con medios adjuntos usando Meta API
   */
  async sendMessageWithMedia(
    to: string,
    message: string,
    mediaUrls: string[],
    tenantId: string,
    providerConfig: ProviderConfig
  ): Promise<any> {
    try {
      this.logger.log(`Enviando WhatsApp con medios via Meta para tenant ${tenantId} a ${to}`);

      const { accessToken, phoneNumberId } = providerConfig.credentials;

      if (!accessToken || !phoneNumberId) {
        throw new Error('Credenciales de Meta incompletas');
      }

      const cleanTo = to.replace(/\D/g, '');
      const mediaUrl = mediaUrls[0]; // Meta permite solo un medio por mensaje

      // Determinar el tipo de medio
      const mediaType = this.getMediaType(mediaUrl);

      const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: cleanTo,
          type: mediaType,
          [mediaType]: {
            link: mediaUrl,
            caption: message,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error Meta API: ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();

      this.logger.log(`WhatsApp con medios enviado exitosamente via Meta: ${data.messages[0].id}`);

      return {
        id: data.messages[0].id,
        status: 'sent',
        provider: 'meta',
        channel: 'whatsapp',
        to: `whatsapp:+${cleanTo}`,
        from: `whatsapp:${phoneNumberId}`,
        body: message,
        sentAt: new Date(),
        mediaUrls,
      };
    } catch (error) {
      this.logger.error(`Error enviando WhatsApp con medios via Meta: ${error.message}`);
      throw new Error(`Error Meta WhatsApp con medios: ${error.message}`);
    }
  }

  /**
   * Procesa webhooks entrantes de Meta WhatsApp
   */
  async processWebhook(webhookData: any): Promise<any> {
    try {
      this.logger.log(`Procesando webhook WhatsApp de Meta`);

      // Meta envía los webhooks en un formato diferente
      const entry = webhookData.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      if (!value?.messages) {
        return null;
      }

      const message = value.messages[0];
      const contacts = value.contacts?.[0];

      return {
        messageId: message.id,
        from: `whatsapp:+${message.from}`,
        to: `whatsapp:${value.metadata.phone_number_id}`,
        body: message.text?.body || '',
        status: 'received',
        profileName: contacts?.profile?.name,
        waId: message.from,
        mediaUrls: this.extractMetaMediaUrls(message),
        timestamp: new Date(parseInt(message.timestamp) * 1000),
      };
    } catch (error) {
      this.logger.error(`Error procesando webhook WhatsApp de Meta: ${error.message}`);
      throw error;
    }
  }

  /**
   * Extrae URLs de medios del webhook de Meta
   */
  private extractMetaMediaUrls(message: any): string[] {
    const mediaUrls: string[] = [];

    if (message.image) {
      mediaUrls.push(message.image.id);
    } else if (message.document) {
      mediaUrls.push(message.document.id);
    } else if (message.audio) {
      mediaUrls.push(message.audio.id);
    } else if (message.video) {
      mediaUrls.push(message.video.id);
    } else if (message.sticker) {
      mediaUrls.push(message.sticker.id);
    }

    return mediaUrls;
  }

  /**
   * Determina el tipo de medio basado en la URL
   */
  private getMediaType(mediaUrl: string): string {
    const url = mediaUrl.toLowerCase();
    
    if (url.includes('image') || /\.(jpg|jpeg|png|gif|webp)$/i.test(url)) {
      return 'image';
    } else if (url.includes('video') || /\.(mp4|avi|mov|webm)$/i.test(url)) {
      return 'video';
    } else if (url.includes('audio') || /\.(mp3|wav|ogg)$/i.test(url)) {
      return 'audio';
    } else if (url.includes('document') || /\.(pdf|doc|docx|txt)$/i.test(url)) {
      return 'document';
    } else {
      return 'image'; // Por defecto
    }
  }

  /**
   * Verifica el estado de un mensaje (Meta no proporciona este endpoint directamente)
   */
  async getMessageStatus(messageId: string, providerConfig: ProviderConfig): Promise<any> {
    this.logger.warn('Meta API no proporciona endpoint directo para verificar estado de mensajes');
    
    return {
      id: messageId,
      status: 'sent', // Meta no proporciona estados detallados
      provider: 'meta',
      channel: 'whatsapp',
      sentAt: new Date(),
    };
  }
}
