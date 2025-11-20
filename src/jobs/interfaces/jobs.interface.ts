// Interfaces principales para el módulo de Jobs

export type JobType = 
  | 'webhook-retry'
  | 'payment-sync'
  | 'delivery-sync'
  | 'message-retry'
  | 'cleanup'
  | 'report'
  | 'notification';

export type JobPriority = 'low' | 'normal' | 'high';

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface Job {
  id: string;
  type: JobType;
  tenantId: string;
  data: Record<string, any>;
  priority: JobPriority;
  status: JobStatus;
  result?: any;
  error?: string;
  retryCount?: number;
  maxRetries?: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  failedAt?: Date;
  scheduledJobId?: string;
}

import { ApiProperty } from '@nestjs/swagger';

export class CreateJobDto {
  @ApiProperty({ description: 'Tipo de trabajo' })
  type: JobType;

  @ApiProperty({ description: 'ID del tenant' })
  tenantId: string;

  @ApiProperty({ description: 'Datos del trabajo' })
  data: Record<string, any>;

  @ApiProperty({ description: 'Prioridad del trabajo', required: false })
  priority?: JobPriority;
}

export interface ScheduledJob {
  id: string;
  tenantId: string;
  jobType: JobType;
  schedule: JobSchedule;
  data: Record<string, any>;
  priority: JobPriority;
  isActive: boolean;
  nextRun: Date;
  lastRun?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class ScheduleJobDto {
  @ApiProperty({ description: 'ID del trabajo programado', required: false })
  id: string;

  @ApiProperty({ description: 'ID del tenant' })
  tenantId: string;

  @ApiProperty({ description: 'Tipo de trabajo' })
  jobType: JobType;

  @ApiProperty({ description: 'Configuración de horario' })
  schedule: JobSchedule;

  @ApiProperty({ description: 'Datos del trabajo' })
  data: Record<string, any>;

  @ApiProperty({ description: 'Prioridad del trabajo', required: false })
  priority?: JobPriority;

  @ApiProperty({ description: 'Si el trabajo está activo', required: false })
  isActive?: boolean;
}

export interface JobSchedule {
  type: 'cron' | 'interval' | 'once';
  expression?: string; // Para cron
  interval?: number; // Para interval (en ms)
  dateTime?: Date; // Para once
}

export interface JobStats {
  tenantId: string;
  totalJobs: number;
  pendingJobs: number;
  processingJobs: number;
  completedJobs: number;
  failedJobs: number;
  scheduledJobs: number;
  activeScheduledJobs: number;
  byType: Record<JobType, number>;
  averageProcessingTime: number;
  retryStats: {
    totalRetries: number;
    successfulRetries: number;
    failedRetries: number;
    averageRetryCount: number;
  };
  lastUpdated: Date;
}

export interface JobLog {
  id: string;
  jobId: string;
  tenantId: string;
  action: 'created' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'retried' | 'executed';
  details?: Record<string, any>;
  errorMessage?: string;
  timestamp: Date;
  processingTime?: number;
}

export interface JobQueueStatus {
  queueName: string;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  lastProcessed?: Date;
}

export interface JobProcessorInfo {
  type: JobType;
  description: string;
  estimatedTime: string;
  isAvailable: boolean;
  lastProcessed?: Date;
}

export interface JobRetryConfig {
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier: number;
  maxRetryDelay: number;
}

export interface JobValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Interfaces para diferentes tipos de trabajos

export interface WebhookRetryJobData {
  webhookUrl: string;
  eventId: string;
  eventType: string;
  payload: Record<string, any>;
  retryCount: number;
  maxRetries: number;
  lastError?: string;
}

export interface PaymentSyncJobData {
  paymentId: string;
  provider: string;
  syncType: 'status' | 'refund' | 'webhook';
  tenantId: string;
  providerPaymentId?: string;
}

export interface DeliverySyncJobData {
  deliveryId: string;
  provider: string;
  syncType: 'status' | 'tracking' | 'webhook';
  tenantId: string;
  providerDeliveryId?: string;
}

export interface MessageRetryJobData {
  messageId: string;
  channel: 'sms' | 'whatsapp' | 'email';
  to: string;
  content: Record<string, any>;
  provider: string;
  retryCount: number;
  maxRetries: number;
  lastError?: string;
}

export interface CleanupJobData {
  dataType: 'logs' | 'jobs' | 'webhooks' | 'payments' | 'messages';
  olderThan: number; // días
  tenantId: string;
  batchSize?: number;
}

export interface ReportJobData {
  reportType: 'daily' | 'weekly' | 'monthly' | 'custom';
  period?: string;
  tenantId: string;
  format?: 'json' | 'csv' | 'pdf';
  includeCharts?: boolean;
}

export interface NotificationJobData {
  type: 'email' | 'sms' | 'webhook';
  recipient: string;
  subject?: string;
  message: string;
  templateId?: string;
  data?: Record<string, any>;
}

// Interfaces para eventos de trabajos

export interface JobEvent {
  jobId: string;
  tenantId: string;
  eventType: 'created' | 'started' | 'completed' | 'failed' | 'cancelled' | 'retried';
  eventData: Record<string, any>;
  timestamp: Date;
  source: 'api' | 'scheduler' | 'system';
}

export interface JobProgress {
  jobId: string;
  progress: number; // 0-100
  message?: string;
  currentStep?: string;
  totalSteps?: number;
  estimatedTimeRemaining?: number;
  lastUpdated: Date;
}

// Interfaces para configuración avanzada

export interface JobLimits {
  tenantId: string;
  maxConcurrentJobs: number;
  maxJobsPerHour: number;
  maxJobsPerDay: number;
  maxJobDuration: number; // ms
  maxRetryAttempts: number;
  retryDelay: number; // ms
}

export interface JobPreferences {
  tenantId: string;
  defaultPriority: JobPriority;
  enableRetries: boolean;
  enableScheduling: boolean;
  enableProgressTracking: boolean;
  notificationEmails: string[];
  webhookNotifications: string[];
}

// Interfaces para monitoreo

export interface JobMetrics {
  tenantId: string;
  period: 'hour' | 'day' | 'week' | 'month';
  startDate: Date;
  endDate: Date;
  metrics: {
    volume: {
      total: number;
      completed: number;
      failed: number;
      cancelled: number;
    };
    performance: {
      averageProcessingTime: number;
      successRate: number;
      failureRate: number;
      retryRate: number;
    };
    trends: {
      volumeChange: number;
      successRateChange: number;
      processingTimeChange: number;
    };
  };
}

export interface JobAlert {
  id: string;
  tenantId: string;
  type: 'high_failure_rate' | 'slow_processing' | 'queue_backlog' | 'job_timeout';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  jobType?: JobType;
  threshold?: number;
  currentValue?: number;
  triggeredAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
}

// Interfaces para auditoría

export interface JobAuditLog {
  id: string;
  tenantId: string;
  jobId?: string;
  action: 'create' | 'update' | 'delete' | 'schedule' | 'unschedule' | 'execute' | 'cancel';
  changes?: Record<string, any>;
  previousValues?: Record<string, any>;
  newValues?: Record<string, any>;
  timestamp: Date;
  userId?: string;
  ipAddress?: string;
  reason?: string;
}

// Interfaces para health check

export interface JobHealthCheck {
  tenantId: string;
  status: 'healthy' | 'warning' | 'error';
  checks: {
    queue: 'ok' | 'warning' | 'error';
    processors: 'ok' | 'warning' | 'error';
    scheduler: 'ok' | 'warning' | 'error';
    retry: 'ok' | 'warning' | 'error';
  };
  lastChecked: Date;
  message?: string;
}
