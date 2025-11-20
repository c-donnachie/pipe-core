import { Module } from '@nestjs/common';
import { MessagingController } from './messaging.controller';
import { MessagingService } from './messaging.service';
import { MessageRouter } from './messageRouter';

// Adaptadores
import { TwilioWhatsappAdapter } from './channels/whatsapp/twilioAdapter';
import { MetaWhatsappAdapter } from './channels/whatsapp/metaAdapter';
import { TwilioSmsAdapter } from './channels/sms/twilioAdapter';
import { SendgridEmailAdapter } from './channels/email/sendgridAdapter';
import { ResendEmailAdapter } from './channels/email/resendAdapter';

// Servicios por canal
import { WhatsappService } from './channels/whatsapp/whatsappService';
import { SmsService } from './channels/sms/smsService';
import { EmailService } from './channels/email/emailService';

@Module({
  controllers: [MessagingController],
  providers: [
    // Router principal
    MessageRouter,
    
    // Adaptadores
    TwilioWhatsappAdapter,
    MetaWhatsappAdapter,
    TwilioSmsAdapter,
    SendgridEmailAdapter,
    ResendEmailAdapter,
    
    // Servicios por canal
    WhatsappService,
    SmsService,
    EmailService,
    
    // Servicio principal
    MessagingService,
  ],
  exports: [MessagingService],
})
export class MessagingModule {}
