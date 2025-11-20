// Interfaces compartidas para todos los canales de mensajería

export interface BaseMessage {
  tenantId: string;
  to: string;
  from: string;
  body: string;
  channel: 'sms' | 'whatsapp' | 'email';
  templateId?: string;
  templateParams?: Record<string, any>;
}

export interface TwilioMessage extends BaseMessage {
  channel: 'sms' | 'whatsapp';
  mediaUrl?: string[];
}

export interface EmailMessage extends BaseMessage {
  channel: 'email';
  subject: string;
  htmlContent?: string;
  textContent?: string;
  attachments?: any[];
}

export interface MessageResponse {
  id: string;
  status: string;
  provider: string;
  channel: 'sms' | 'whatsapp' | 'email';
  to: string;
  from: string;
  body?: string;
  subject?: string;
  sentAt: Date;
  errorCode?: number;
  errorMessage?: string;
  mediaUrls?: string[];
}

export interface TwilioMessageResponse {
  sid: string;
  status: string;
  to: string;
  from: string;
  body: string;
  dateCreated: Date;
  dateUpdated: Date;
  errorCode?: number;
  errorMessage?: string;
}

export interface EmailMessageResponse {
  messageId: string;
  status: string;
  to: string;
  from: string;
  subject: string;
  sentAt: Date;
}

export interface TwilioWebhookPayload {
  MessageSid: string;
  From: string;
  To: string;
  Body: string;
  MessageStatus: string;
  SmsStatus?: string;
  MediaUrl0?: string;
  MediaUrl1?: string;
  MediaUrl2?: string;
  MediaUrl3?: string;
  MediaContentType0?: string;
  MediaContentType1?: string;
  MediaContentType2?: string;
  MediaContentType3?: string;
  NumMedia: string;
  ProfileName?: string;
  WaId?: string;
}

export interface MessageTemplate {
  id: string;
  tenantId: string;
  name: string;
  content: string;
  channel: 'sms' | 'whatsapp' | 'email';
  variables: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailTemplate extends Omit<MessageTemplate, 'content'> {
  channel: 'email';
  subject: string;
  htmlContent: string;
  textContent?: string;
  fromEmail?: string;
}

export interface MessageLog {
  id: string;
  tenantId: string;
  messageId: string;
  to: string;
  from: string;
  body: string;
  channel: 'sms' | 'whatsapp' | 'email';
  status: string;
  direction: 'inbound' | 'outbound';
  provider?: string;
  templateId?: string;
  mediaUrls?: string[];
  errorCode?: number;
  errorMessage?: string;
  webhookPayload?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantCredentials {
  id: string;
  tenantId: string;
  provider: 'twilio' | 'sendgrid' | 'resend';
  accountSid?: string;
  authToken?: string;
  apiKey?: string;
  whatsappNumber?: string;
  phoneNumber?: string;
  fromEmail?: string;
  webhookUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Interfaces para el módulo principal de messaging
export interface MessagingService {
  sendSms(messageData: Omit<TwilioMessage, 'channel'>): Promise<TwilioMessageResponse>;
  sendWhatsapp(messageData: Omit<TwilioMessage, 'channel'>): Promise<TwilioMessageResponse>;
  sendEmail(messageData: EmailMessage): Promise<EmailMessageResponse>;
  processWebhook(channel: 'sms' | 'whatsapp' | 'email', webhookData: any): Promise<void>;
  getLogs(tenantId: string, channel: 'sms' | 'whatsapp' | 'email', limit?: number): Promise<MessageLog[]>;
}

export interface MessagingStats {
  tenantId: string;
  totalSent: number;
  totalReceived: number;
  smsCount: number;
  whatsappCount: number;
  emailCount: number;
  successRate: number;
  lastActivity: Date;
}
