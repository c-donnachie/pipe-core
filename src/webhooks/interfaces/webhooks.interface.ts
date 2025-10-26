// Interfaces principales para el módulo de Webhooks
import { ApiProperty } from '@nestjs/swagger';

export interface WebhookEvent {
  eventId: string;
  eventType: string;
  tenantId: string;
  data: Record<string, any>;
  source: string;
  timestamp: Date;
}

export class CreateWebhookEventDto {
  @ApiProperty({ description: 'Tipo de evento' })
  eventType: string;

  @ApiProperty({ description: 'ID del tenant' })
  tenantId: string;

  @ApiProperty({ description: 'Datos del evento' })
  data: Record<string, any>;

  @ApiProperty({ description: 'Fuente del evento', required: false })
  source?: string;
}

export interface WebhookConfig {
  tenantId: string;
  eventType: string;
  webhookUrl: string;
  secret: string;
  isActive: boolean;
  retryAttempts: number;
  timeout: number;
}

export interface WebhookLog {
  id: string;
  eventId: string;
  tenantId: string;
  eventType: string;
  webhookUrl: string;
  status: 'delivered' | 'failed' | 'retrying';
  responseTime: number;
  responseStatus?: number;
  errorMessage?: string;
  deliveredAt: Date;
  retryCount: number;
  nextRetryAt?: Date;
}

export interface WebhookStats {
  tenantId: string;
  period: 'day' | 'week' | 'month';
  startDate: Date;
  endDate: Date;
  totalEvents: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  averageResponseTime: number;
  successRate: number;
  byEventType: Record<string, {
    count: number;
    successRate: number;
    averageResponseTime: number;
  }>;
  byStatus: Record<string, number>;
  retryStats: {
    totalRetries: number;
    successfulRetries: number;
    failedRetries: number;
    averageRetryCount: number;
  };
}

export interface WebhookValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface WebhookDeliveryLog {
  eventId: string;
  tenantId: string;
  webhookUrl: string;
  status: 'delivered' | 'failed';
  responseTime: number;
  responseStatus: number;
  errorMessage?: string;
  deliveredAt: Date;
}

export interface RetryQueueItem {
  id: string;
  eventId: string;
  tenantId: string;
  eventType: string;
  webhookUrl: string;
  payload: Record<string, any>;
  retryCount: number;
  maxRetries: number;
  nextRetryAt: Date;
  lastError?: string;
  createdAt: Date;
}

export interface WebhookHealthCheck {
  tenantId: string;
  status: 'healthy' | 'warning' | 'error';
  checks: {
    webhooks: 'ok' | 'warning' | 'error';
    deliveries: 'ok' | 'warning' | 'error';
    retryQueue: 'ok' | 'warning' | 'error';
  };
  lastChecked: Date;
  message?: string;
}

export interface WebhookMetrics {
  tenantId: string;
  period: 'hour' | 'day' | 'week' | 'month';
  startDate: Date;
  endDate: Date;
  metrics: {
    volume: {
      totalEvents: number;
      successfulDeliveries: number;
      failedDeliveries: number;
      retries: number;
    };
    performance: {
      averageResponseTime: number;
      successRate: number;
      failureRate: number;
      retryRate: number;
    };
    trends: {
      volumeChange: number;
      successRateChange: number;
      responseTimeChange: number;
    };
  };
}

// Interfaces para diferentes proveedores de webhook

export interface MercadoPagoWebhookPayload {
  id: number;
  live_mode: boolean;
  type: string;
  date_created: string;
  application_id: number;
  user_id: number;
  version: number;
  api_version: string;
  action: string;
  data: {
    id: string;
  };
}

export interface TransbankWebhookPayload {
  token: string;
  buy_order: string;
  session_id: string;
  amount: number;
  status: string;
  authorization_code?: string;
  payment_type_code?: string;
  response_code?: number;
  installments_number?: number;
  accounting_date?: string;
  transaction_date?: string;
}

export interface StripeWebhookPayload {
  id: string;
  object: string;
  api_version: string;
  created: number;
  data: {
    object: any;
  };
  livemode: boolean;
  pending_webhooks: number;
  request: {
    id: string;
    idempotency_key?: string;
  };
  type: string;
}

// Interfaces para eventos específicos

export interface PaymentCompletedEvent {
  eventType: 'payment.completed';
  paymentId: string;
  amount: number;
  currency: string;
  customerEmail?: string;
  orderId?: string;
  provider: string;
  providerPaymentId: string;
  completedAt: Date;
}

export interface PaymentFailedEvent {
  eventType: 'payment.failed';
  paymentId: string;
  amount: number;
  currency: string;
  customerEmail?: string;
  orderId?: string;
  provider: string;
  providerPaymentId: string;
  errorMessage: string;
  failedAt: Date;
}

export interface DeliveryCompletedEvent {
  eventType: 'delivery.completed';
  deliveryId: string;
  orderId: string;
  status: string;
  provider: string;
  providerDeliveryId: string;
  estimatedTime?: number;
  actualTime?: number;
  completedAt: Date;
}

export interface MessageDeliveredEvent {
  eventType: 'message.delivered';
  messageId: string;
  channel: 'sms' | 'whatsapp' | 'email';
  to: string;
  provider: string;
  providerMessageId: string;
  deliveredAt: Date;
}

export interface MessageFailedEvent {
  eventType: 'message.failed';
  messageId: string;
  channel: 'sms' | 'whatsapp' | 'email';
  to: string;
  provider: string;
  providerMessageId: string;
  errorMessage: string;
  failedAt: Date;
}

// Interfaces para configuración avanzada

export interface WebhookLimits {
  tenantId: string;
  maxEventsPerMinute: number;
  maxEventsPerHour: number;
  maxEventsPerDay: number;
  maxRetryAttempts: number;
  retryDelayMinutes: number;
  maxRetryDelayMinutes: number;
}

export interface WebhookPreferences {
  tenantId: string;
  defaultTimeout: number;
  defaultRetryAttempts: number;
  enableRetries: boolean;
  enableSignatureValidation: boolean;
  enableResponseValidation: boolean;
  webhookSecretRotation: boolean;
  notificationEmails: string[];
}

// Interfaces para auditoría

export interface WebhookAuditLog {
  id: string;
  tenantId: string;
  action: 'create' | 'update' | 'delete' | 'activate' | 'deactivate' | 'test';
  webhookUrl?: string;
  eventType?: string;
  changes?: Record<string, any>;
  previousValues?: Record<string, any>;
  newValues?: Record<string, any>;
  timestamp: Date;
  userId?: string;
  ipAddress?: string;
  reason?: string;
}

// Interfaces para monitoreo

export interface WebhookAlert {
  id: string;
  tenantId: string;
  type: 'high_failure_rate' | 'slow_response' | 'retry_queue_full' | 'webhook_down';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  webhookUrl?: string;
  eventType?: string;
  threshold?: number;
  currentValue?: number;
  triggeredAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
}

export interface WebhookNotification {
  id: string;
  tenantId: string;
  type: 'email' | 'sms' | 'webhook';
  recipient: string;
  subject?: string;
  message: string;
  eventType?: string;
  webhookUrl?: string;
  sentAt: Date;
  status: 'pending' | 'sent' | 'failed';
  errorMessage?: string;
}
