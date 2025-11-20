// Interfaces principales para el módulo de Tenants
import { ApiProperty } from '@nestjs/swagger';

export interface Tenant {
  tenantId: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantConfig {
  tenantId: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'suspended';
  settings: TenantSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantSettings {
  messaging: {
    defaultProvider: string;
    fallbackProvider?: string;
    retryAttempts: number;
    timeout: number;
  };
  payments: {
    defaultProvider: string;
    fallbackProvider?: string;
    currency: string;
    retryAttempts: number;
  };
  delivery: {
    defaultProvider: string;
    fallbackProvider?: string;
    retryAttempts: number;
  };
  notifications: {
    webhookUrl?: string;
    emailNotifications: boolean;
    smsNotifications: boolean;
  };
  limits: {
    maxMessagesPerDay: number;
    maxPaymentsPerDay: number;
    maxDeliveryRequestsPerDay: number;
  };
}

export interface TenantCredentials {
  tenantId: string;
  provider: string;
  channel: 'sms' | 'whatsapp' | 'email' | 'payment' | 'delivery';
  credentials: {
    apiKey: string;
    secretKey?: string;
    fromEmail?: string;
    fromPhone?: string;
    webhookUrl?: string;
    [key: string]: any;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantStats {
  tenantId: string;
  totalMessages: number;
  successfulMessages: number;
  failedMessages: number;
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  activeIntegrations: number;
  lastActivity?: Date;
}

export class CreateTenantDto {
  @ApiProperty({ description: 'Nombre del tenant' })
  name: string;

  @ApiProperty({ description: 'Descripción del tenant', required: false })
  description?: string;

  @ApiProperty({ description: 'Configuraciones del tenant', required: false })
  settings?: Partial<TenantSettings>;
}

export class UpdateTenantDto {
  @ApiProperty({ description: 'Nombre del tenant', required: false })
  name?: string;

  @ApiProperty({ description: 'Descripción del tenant', required: false })
  description?: string;

  @ApiProperty({ description: 'Estado del tenant', required: false })
  status?: 'active' | 'inactive' | 'suspended';

  @ApiProperty({ description: 'Configuraciones del tenant', required: false })
  settings?: Partial<TenantSettings>;
}

export interface TenantValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface TenantHealthCheck {
  tenantId: string;
  status: 'healthy' | 'warning' | 'error';
  checks: {
    credentials: 'ok' | 'warning' | 'error';
    integrations: 'ok' | 'warning' | 'error';
    limits: 'ok' | 'warning' | 'error';
  };
  lastChecked: Date;
  message?: string;
}

// Interfaces para logs y auditoría
export interface TenantLog {
  id: string;
  tenantId: string;
  action: string;
  details: Record<string, any>;
  timestamp: Date;
  userId?: string;
  ipAddress?: string;
}

export interface TenantAudit {
  tenantId: string;
  action: 'create' | 'update' | 'delete' | 'activate' | 'deactivate' | 'suspend';
  changes: Record<string, any>;
  previousValues?: Record<string, any>;
  newValues?: Record<string, any>;
  timestamp: Date;
  userId?: string;
  reason?: string;
}

// Interfaces para configuración de proveedores
export interface ProviderConfig {
  provider: string;
  channel: string;
  credentials: Record<string, any>;
  isActive: boolean;
  priority: number;
  fallbackTo?: string;
}

export interface TenantProviderConfig {
  tenantId: string;
  providers: {
    messaging: ProviderConfig[];
    payments: ProviderConfig[];
    delivery: ProviderConfig[];
  };
  defaultProviders: {
    messaging: string;
    payments: string;
    delivery: string;
  };
}

// Interfaces para métricas y analytics
export interface TenantMetrics {
  tenantId: string;
  period: 'day' | 'week' | 'month' | 'year';
  startDate: Date;
  endDate: Date;
  metrics: {
    messages: {
      total: number;
      successful: number;
      failed: number;
      byChannel: Record<string, number>;
      byProvider: Record<string, number>;
    };
    payments: {
      total: number;
      successful: number;
      failed: number;
      totalAmount: number;
      byProvider: Record<string, number>;
    };
    deliveries: {
      total: number;
      successful: number;
      failed: number;
      byProvider: Record<string, number>;
    };
  };
}

// Interfaces para eventos de tenant
export interface TenantEvent {
  tenantId: string;
  eventType: 'created' | 'updated' | 'activated' | 'deactivated' | 'suspended';
  eventData: Record<string, any>;
  timestamp: Date;
  source: 'api' | 'webhook' | 'system';
}
