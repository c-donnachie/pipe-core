// Interfaces principales para el módulo de Payments
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty({ description: 'ID del tenant' })
  tenantId: string;

  @ApiProperty({ description: 'Monto del pago' })
  amount: number;

  @ApiProperty({ description: 'Moneda del pago' })
  currency: string;

  @ApiProperty({ description: 'Descripción del pago', required: false })
  description?: string;

  @ApiProperty({ description: 'Email del cliente', required: false })
  customerEmail?: string;

  @ApiProperty({ description: 'Teléfono del cliente', required: false })
  customerPhone?: string;

  @ApiProperty({ description: 'Nombre del cliente', required: false })
  customerName?: string;

  @ApiProperty({ description: 'ID del pedido', required: false })
  orderId?: string;

  @ApiProperty({ description: 'Metadatos adicionales', required: false })
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'URL del webhook', required: false })
  webhookUrl?: string;

  @ApiProperty({ description: 'URL de retorno', required: false })
  returnUrl?: string;

  @ApiProperty({ description: 'URL de cancelación', required: false })
  cancelUrl?: string;
}

export interface PaymentResponse {
  paymentId: string;
  providerPaymentId: string;
  provider: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  amount: number;
  currency: string;
  paymentUrl?: string;
  qrCode?: string;
  message?: string;
  createdAt: Date;
  expiresAt?: Date;
}

export interface PaymentStatus {
  paymentId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  amount: number;
  currency: string;
  message?: string;
  lastUpdated: Date;
  providerResponse?: Record<string, any>;
}

export interface PaymentWebhookPayload {
  event: string;
  data: Record<string, any>;
  signature?: string;
  timestamp?: string;
  [key: string]: any;
}

export interface PaymentLog {
  id: string;
  tenantId: string;
  paymentId: string;
  providerPaymentId: string;
  provider: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  description?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerName?: string;
  orderId?: string;
  metadata?: Record<string, any>;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentStats {
  tenantId: string;
  period: 'day' | 'week' | 'month';
  startDate: Date;
  endDate: Date;
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
  cancelledPayments: number;
  totalAmount: number;
  successfulAmount: number;
  averageAmount: number;
  byProvider: Record<string, {
    count: number;
    amount: number;
    successRate: number;
  }>;
  byStatus: Record<string, number>;
  byCurrency: Record<string, {
    count: number;
    amount: number;
  }>;
}

export interface PaymentProviderConfig {
  provider: string;
  credentials: {
    accessToken?: string;
    publicKey?: string;
    secretKey?: string;
    apiKey?: string;
    commerceCode?: string;
    publishableKey?: string;
    [key: string]: any;
  };
  isActive: boolean;
  priority: number;
}

export interface PaymentValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface RefundLog {
  id: string;
  tenantId: string;
  originalPaymentId: string;
  refundId: string;
  amount: number;
  currency: string;
  reason?: string;
  status: 'pending' | 'completed' | 'failed';
  providerRefundId?: string;
  createdAt: Date;
  processedAt?: Date;
}

export interface WebhookLog {
  id: string;
  tenantId: string;
  provider: string;
  event: string;
  paymentId?: string;
  status: 'received' | 'processed' | 'failed';
  payload: Record<string, any>;
  response?: Record<string, any>;
  errorMessage?: string;
  receivedAt: Date;
  processedAt?: Date;
}

export interface PaymentHealthCheck {
  tenantId: string;
  status: 'healthy' | 'warning' | 'error';
  checks: {
    provider: 'ok' | 'warning' | 'error';
    credentials: 'ok' | 'warning' | 'error';
    connectivity: 'ok' | 'warning' | 'error';
  };
  lastChecked: Date;
  message?: string;
}

export interface PaymentMetrics {
  tenantId: string;
  period: 'hour' | 'day' | 'week' | 'month';
  startDate: Date;
  endDate: Date;
  metrics: {
    volume: {
      total: number;
      successful: number;
      failed: number;
      cancelled: number;
    };
    value: {
      total: number;
      successful: number;
      average: number;
      median: number;
    };
    performance: {
      successRate: number;
      averageProcessingTime: number;
      failureRate: number;
    };
    trends: {
      volumeChange: number;
      valueChange: number;
      successRateChange: number;
    };
  };
}

// Interfaces para diferentes proveedores

export interface MercadoPagoPaymentData {
  transaction_amount: number;
  description?: string;
  payment_method_id: string;
  payer: {
    email: string;
    identification?: {
      type: string;
      number: string;
    };
  };
  external_reference?: string;
  notification_url?: string;
  back_urls?: {
    success?: string;
    failure?: string;
    pending?: string;
  };
  metadata?: Record<string, any>;
}

export interface TransbankPaymentData {
  buy_order: string;
  session_id: string;
  amount: number;
  return_url: string;
}

export interface StripePaymentData {
  amount: number;
  currency: string;
  description?: string;
  customer_email?: string;
  metadata?: Record<string, any>;
  success_url?: string;
  cancel_url?: string;
}

// Interfaces para eventos de pago
export interface PaymentEvent {
  tenantId: string;
  paymentId: string;
  eventType: 'created' | 'updated' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  eventData: Record<string, any>;
  timestamp: Date;
  source: 'api' | 'webhook' | 'system';
}

// Interfaces para configuración avanzada
export interface PaymentLimits {
  tenantId: string;
  maxAmount: number;
  minAmount: number;
  maxDailyAmount: number;
  maxDailyTransactions: number;
  allowedCurrencies: string[];
  blockedCountries: string[];
  blockedPaymentMethods: string[];
}

export interface PaymentPreferences {
  tenantId: string;
  defaultCurrency: string;
  defaultPaymentMethod: string;
  autoCapture: boolean;
  requireCustomerEmail: boolean;
  requireCustomerPhone: boolean;
  enablePartialRefunds: boolean;
  enableRecurringPayments: boolean;
  webhookRetries: number;
  webhookTimeout: number;
}
