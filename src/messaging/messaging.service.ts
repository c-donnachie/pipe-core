import { Injectable, Logger } from '@nestjs/common';
import { SmsService } from './channels/sms/smsService';
import { WhatsappService } from './channels/whatsapp/whatsappService';
import { EmailService } from './channels/email/emailService';
import { 
  MessageResponse, 
  MessageLog,
  MessagingStats 
} from './interfaces';

@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name);

  constructor(
    private readonly smsService: SmsService,
    private readonly whatsappService: WhatsappService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Envía un mensaje SMS
   */
  async sendSms(tenantId: string, to: string, message: string): Promise<MessageResponse> {
    this.logger.log(`Enviando SMS para tenant ${tenantId}`);
    return this.smsService.sendSmsMessage(tenantId, to, message);
  }

  /**
   * Envía un mensaje WhatsApp
   */
  async sendWhatsapp(tenantId: string, to: string, message: string, mediaUrls?: string[]): Promise<MessageResponse> {
    this.logger.log(`Enviando WhatsApp para tenant ${tenantId}`);
    return this.whatsappService.sendWhatsAppMessage(tenantId, to, message, mediaUrls);
  }

  /**
   * Envía un email
   */
  async sendEmail(
    tenantId: string, 
    to: string, 
    subject: string, 
    htmlContent: string, 
    textContent: string, 
    from: string,
    attachments?: any[]
  ): Promise<MessageResponse> {
    this.logger.log(`Enviando Email para tenant ${tenantId}`);
    return this.emailService.sendEmailMessage(tenantId, to, subject, htmlContent, textContent, from, attachments);
  }

  /**
   * Procesa webhooks de cualquier canal
   */
  async processWebhook(
    channel: 'sms' | 'whatsapp' | 'email', 
    webhookData: any, 
    tenantId: string, 
    provider: string
  ): Promise<void> {
    this.logger.log(`Procesando webhook ${channel} para tenant ${tenantId} con proveedor ${provider}`);

    switch (channel) {
      case 'sms':
        await this.smsService.processIncomingMessage(tenantId, webhookData, provider as 'twilio');
        break;
      case 'whatsapp':
        await this.whatsappService.processIncomingMessage(tenantId, webhookData, provider as 'twilio' | 'meta');
        break;
      case 'email':
        await this.emailService.processIncomingEvent(tenantId, webhookData, provider as 'sendgrid' | 'resend');
        break;
      default:
        throw new Error(`Canal no soportado: ${channel}`);
    }
  }

  /**
   * Obtiene logs de cualquier canal por tenant
   */
  async getLogs(tenantId: string, channel: 'sms' | 'whatsapp' | 'email', limit = 50): Promise<MessageLog[]> {
    this.logger.log(`Obteniendo logs ${channel} para tenant ${tenantId}`);

    switch (channel) {
      case 'sms':
        return this.smsService.getLogsByTenant(tenantId, limit);
      case 'whatsapp':
        return this.whatsappService.getLogsByTenant(tenantId, limit);
      case 'email':
        return this.emailService.getLogsByTenant(tenantId, limit);
      default:
        throw new Error(`Canal no soportado: ${channel}`);
    }
  }

  /**
   * Obtiene logs de todos los canales por tenant
   */
  async getAllLogs(tenantId: string, limit = 50): Promise<MessageLog[]> {
    this.logger.log(`Obteniendo logs de todos los canales para tenant ${tenantId}`);

    const [smsLogs, whatsappLogs, emailLogs] = await Promise.all([
      this.smsService.getLogsByTenant(tenantId, limit),
      this.whatsappService.getLogsByTenant(tenantId, limit),
      this.emailService.getLogsByTenant(tenantId, limit),
    ]);

    return [...smsLogs, ...whatsappLogs, ...emailLogs]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  /**
   * Obtiene estadísticas de mensajería por tenant
   */
  async getMessagingStats(tenantId: string): Promise<MessagingStats> {
    this.logger.log(`Obteniendo estadísticas de mensajería para tenant ${tenantId}`);

    const [smsLogs, whatsappLogs, emailLogs] = await Promise.all([
      this.smsService.getLogsByTenant(tenantId, 1000),
      this.whatsappService.getLogsByTenant(tenantId, 1000),
      this.emailService.getLogsByTenant(tenantId, 1000),
    ]);

    const allLogs = [...smsLogs, ...whatsappLogs, ...emailLogs];
    
    const totalSent = allLogs.filter(log => log.direction === 'outbound').length;
    const totalReceived = allLogs.filter(log => log.direction === 'inbound').length;
    const smsCount = smsLogs.length;
    const whatsappCount = whatsappLogs.length;
    const emailCount = emailLogs.length;
    
    const successfulMessages = allLogs.filter(log => 
      log.status === 'sent' || log.status === 'delivered'
    ).length;
    
    const successRate = totalSent > 0 ? (successfulMessages / totalSent) * 100 : 0;
    
    const lastActivity = allLogs.length > 0 
      ? allLogs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0].createdAt
      : new Date();

    return {
      tenantId,
      totalSent,
      totalReceived,
      smsCount,
      whatsappCount,
      emailCount,
      successRate: Math.round(successRate * 100) / 100,
      lastActivity,
    };
  }

  /**
   * Envía un mensaje de prueba por canal
   */
  async sendTestMessage(
    channel: 'sms' | 'whatsapp' | 'email',
    tenantId: string,
    to: string
  ): Promise<MessageResponse> {
    this.logger.log(`Enviando mensaje de prueba ${channel} para tenant ${tenantId}`);

    switch (channel) {
      case 'sms':
        return this.smsService.sendSmsMessage(
          tenantId,
          to,
          `🧪 SMS de prueba desde PipeCore API - ${new Date().toLocaleString()}`
        );
      case 'whatsapp':
        return this.whatsappService.sendWhatsAppMessage(
          tenantId,
          to,
          `🧪 WhatsApp de prueba desde PipeCore API - ${new Date().toLocaleString()}`
        );
      case 'email':
        return this.emailService.sendEmailMessage(
          tenantId,
          to,
          '🧪 Email de prueba - PipeCore API',
          `<h2>🧪 Email de prueba</h2><p>Fecha: ${new Date().toLocaleString()}</p>`,
          `Email de prueba desde PipeCore API - ${new Date().toLocaleString()}`,
          'noreply@pipecore.com'
        );
      default:
        throw new Error(`Canal no soportado: ${channel}`);
    }
  }

  /**
   * Verifica el estado de todos los servicios de mensajería
   */
  async healthCheck(): Promise<{
    status: string;
    services: {
      sms: { status: string; timestamp: string };
      whatsapp: { status: string; timestamp: string };
      email: { status: string; timestamp: string };
    };
    timestamp: string;
  }> {
    this.logger.log('Verificando estado de todos los servicios de mensajería');

    const [smsHealth, whatsappHealth, emailHealth] = await Promise.all([
      this.smsService.healthCheck?.() || { status: 'healthy', channel: 'sms', timestamp: new Date().toISOString() },
      this.whatsappService.healthCheck?.() || { status: 'healthy', channel: 'whatsapp', timestamp: new Date().toISOString() },
      this.emailService.healthCheck?.() || { status: 'healthy', channel: 'email', timestamp: new Date().toISOString() },
    ]);

    const overallStatus = [smsHealth, whatsappHealth, emailHealth].every(h => h.status === 'healthy') 
      ? 'healthy' 
      : 'degraded';

    return {
      status: overallStatus,
      services: {
        sms: { status: smsHealth.status, timestamp: smsHealth.timestamp },
        whatsapp: { status: whatsappHealth.status, timestamp: whatsappHealth.timestamp },
        email: { status: emailHealth.status, timestamp: emailHealth.timestamp },
      },
      timestamp: new Date().toISOString(),
    };
  }
}
