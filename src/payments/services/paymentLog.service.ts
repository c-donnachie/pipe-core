import { Injectable, Logger } from '@nestjs/common';
import { PaymentLog, RefundLog, WebhookLog, PaymentStats } from '../interfaces';

@Injectable()
export class PaymentLogService {
  private readonly logger = new Logger(PaymentLogService.name);
  private paymentLogs: Map<string, PaymentLog[]> = new Map();
  private refundLogs: Map<string, RefundLog[]> = new Map();
  private webhookLogs: Map<string, WebhookLog[]> = new Map();

  /**
   * Log de un pago
   */
  async logPayment(paymentLog: Omit<PaymentLog, 'id'>): Promise<PaymentLog> {
    const id = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const log: PaymentLog = {
      ...paymentLog,
      id,
      updatedAt: new Date(),
    };

    const tenantLogs = this.paymentLogs.get(paymentLog.tenantId) || [];
    tenantLogs.push(log);
    this.paymentLogs.set(paymentLog.tenantId, tenantLogs);

    this.logger.log(`Pago loggeado: ${paymentLog.paymentId} para tenant: ${paymentLog.tenantId}`);
    return log;
  }

  /**
   * Obtiene el log de un pago específico
   */
  async getPaymentLog(tenantId: string, paymentId: string): Promise<PaymentLog | null> {
    const tenantLogs = this.paymentLogs.get(tenantId) || [];
    return tenantLogs.find(log => log.paymentId === paymentId) || null;
  }

  /**
   * Actualiza el estado de un pago
   */
  async updatePaymentStatus(paymentId: string, status: string, message?: string): Promise<void> {
    for (const [tenantId, logs] of this.paymentLogs.entries()) {
      const logIndex = logs.findIndex(log => log.paymentId === paymentId);
      if (logIndex >= 0) {
        logs[logIndex].status = status as any;
        logs[logIndex].errorMessage = message;
        logs[logIndex].updatedAt = new Date();
        
        this.logger.log(`Estado de pago actualizado: ${paymentId} -> ${status}`);
        return;
      }
    }
    
    this.logger.warn(`Pago no encontrado para actualizar estado: ${paymentId}`);
  }

  /**
   * Obtiene logs de pagos de un tenant
   */
  async getPaymentLogs(
    tenantId: string, 
    limit: number = 50, 
    offset: number = 0,
    status?: string,
    provider?: string
  ): Promise<PaymentLog[]> {
    let logs = this.paymentLogs.get(tenantId) || [];

    // Filtrar por estado
    if (status) {
      logs = logs.filter(log => log.status === status);
    }

    // Filtrar por proveedor
    if (provider) {
      logs = logs.filter(log => log.provider === provider);
    }

    // Ordenar por fecha de creación (más recientes primero)
    logs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Aplicar paginación
    return logs.slice(offset, offset + limit);
  }

  /**
   * Log de un reembolso
   */
  async logRefund(refundLog: Omit<RefundLog, 'id'>): Promise<RefundLog> {
    const id = `refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const log: RefundLog = {
      ...refundLog,
      id,
    };

    const tenantLogs = this.refundLogs.get(refundLog.tenantId) || [];
    tenantLogs.push(log);
    this.refundLogs.set(refundLog.tenantId, tenantLogs);

    this.logger.log(`Reembolso loggeado: ${refundLog.refundId} para tenant: ${refundLog.tenantId}`);
    return log;
  }

  /**
   * Obtiene logs de reembolsos de un tenant
   */
  async getRefundLogs(tenantId: string, limit: number = 50, offset: number = 0): Promise<RefundLog[]> {
    let logs = this.refundLogs.get(tenantId) || [];

    // Ordenar por fecha de creación (más recientes primero)
    logs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Aplicar paginación
    return logs.slice(offset, offset + limit);
  }

  /**
   * Log de un webhook
   */
  async logWebhook(webhookLog: Omit<WebhookLog, 'id'>): Promise<WebhookLog> {
    const id = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const log: WebhookLog = {
      ...webhookLog,
      id,
      processedAt: webhookLog.status === 'processed' ? new Date() : undefined,
    };

    const tenantLogs = this.webhookLogs.get(webhookLog.tenantId) || [];
    tenantLogs.push(log);
    this.webhookLogs.set(webhookLog.tenantId, tenantLogs);

    this.logger.log(`Webhook loggeado: ${webhookLog.event} para tenant: ${webhookLog.tenantId}`);
    return log;
  }

  /**
   * Obtiene logs de webhooks de un tenant
   */
  async getWebhookLogs(tenantId: string, limit: number = 50, offset: number = 0): Promise<WebhookLog[]> {
    let logs = this.webhookLogs.get(tenantId) || [];

    // Ordenar por fecha de recepción (más recientes primero)
    logs.sort((a, b) => b.receivedAt.getTime() - a.receivedAt.getTime());

    // Aplicar paginación
    return logs.slice(offset, offset + limit);
  }

  /**
   * Obtiene estadísticas de pagos de un tenant
   */
  async getPaymentStats(tenantId: string, period: 'day' | 'week' | 'month' = 'day'): Promise<PaymentStats> {
    const logs = this.paymentLogs.get(tenantId) || [];
    
    // Calcular fechas según el período
    const now = new Date();
    const startDate = new Date();
    
    switch (period) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
    }

    // Filtrar logs del período
    const periodLogs = logs.filter(log => log.createdAt >= startDate);

    // Calcular estadísticas básicas
    const totalPayments = periodLogs.length;
    const successfulPayments = periodLogs.filter(log => log.status === 'completed').length;
    const failedPayments = periodLogs.filter(log => log.status === 'failed').length;
    const cancelledPayments = periodLogs.filter(log => log.status === 'cancelled').length;

    // Calcular montos
    const totalAmount = periodLogs.reduce((sum, log) => sum + log.amount, 0);
    const successfulAmount = periodLogs
      .filter(log => log.status === 'completed')
      .reduce((sum, log) => sum + log.amount, 0);
    const averageAmount = totalPayments > 0 ? totalAmount / totalPayments : 0;

    // Estadísticas por proveedor
    const byProvider: Record<string, { count: number; amount: number; successRate: number }> = {};
    periodLogs.forEach(log => {
      if (!byProvider[log.provider]) {
        byProvider[log.provider] = { count: 0, amount: 0, successRate: 0 };
      }
      byProvider[log.provider].count++;
      byProvider[log.provider].amount += log.amount;
    });

    // Calcular tasa de éxito por proveedor
    Object.keys(byProvider).forEach(provider => {
      const providerLogs = periodLogs.filter(log => log.provider === provider);
      const successful = providerLogs.filter(log => log.status === 'completed').length;
      byProvider[provider].successRate = providerLogs.length > 0 ? (successful / providerLogs.length) * 100 : 0;
    });

    // Estadísticas por estado
    const byStatus: Record<string, number> = {};
    periodLogs.forEach(log => {
      byStatus[log.status] = (byStatus[log.status] || 0) + 1;
    });

    // Estadísticas por moneda
    const byCurrency: Record<string, { count: number; amount: number }> = {};
    periodLogs.forEach(log => {
      if (!byCurrency[log.currency]) {
        byCurrency[log.currency] = { count: 0, amount: 0 };
      }
      byCurrency[log.currency].count++;
      byCurrency[log.currency].amount += log.amount;
    });

    const stats: PaymentStats = {
      tenantId,
      period,
      startDate,
      endDate: now,
      totalPayments,
      successfulPayments,
      failedPayments,
      cancelledPayments,
      totalAmount,
      successfulAmount,
      averageAmount,
      byProvider,
      byStatus,
      byCurrency,
    };

    this.logger.log(`Estadísticas de pagos generadas para tenant ${tenantId}: ${totalPayments} pagos en período ${period}`);
    
    return stats;
  }

  /**
   * Obtiene métricas de rendimiento de pagos
   */
  async getPaymentMetrics(tenantId: string, period: 'hour' | 'day' | 'week' | 'month'): Promise<{
    volume: { total: number; successful: number; failed: number; cancelled: number };
    value: { total: number; successful: number; average: number; median: number };
    performance: { successRate: number; averageProcessingTime: number; failureRate: number };
  }> {
    const logs = this.paymentLogs.get(tenantId) || [];
    
    // Calcular fechas según el período
    const now = new Date();
    const startDate = new Date();
    
    switch (period) {
      case 'hour':
        startDate.setHours(now.getHours() - 1);
        break;
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
    }

    // Filtrar logs del período
    const periodLogs = logs.filter(log => log.createdAt >= startDate);

    // Métricas de volumen
    const volume = {
      total: periodLogs.length,
      successful: periodLogs.filter(log => log.status === 'completed').length,
      failed: periodLogs.filter(log => log.status === 'failed').length,
      cancelled: periodLogs.filter(log => log.status === 'cancelled').length,
    };

    // Métricas de valor
    const amounts = periodLogs.map(log => log.amount);
    const total = amounts.reduce((sum, amount) => sum + amount, 0);
    const successful = periodLogs
      .filter(log => log.status === 'completed')
      .reduce((sum, log) => sum + log.amount, 0);
    const average = amounts.length > 0 ? total / amounts.length : 0;
    
    // Calcular mediana
    const sortedAmounts = amounts.sort((a, b) => a - b);
    const median = sortedAmounts.length > 0 
      ? sortedAmounts[Math.floor(sortedAmounts.length / 2)]
      : 0;

    const value = {
      total,
      successful,
      average,
      median,
    };

    // Métricas de rendimiento
    const successRate = volume.total > 0 ? (volume.successful / volume.total) * 100 : 0;
    const failureRate = volume.total > 0 ? (volume.failed / volume.total) * 100 : 0;
    
    // Simular tiempo de procesamiento (en una implementación real vendría de los logs)
    const averageProcessingTime = Math.random() * 30 + 5; // 5-35 segundos

    const performance = {
      successRate,
      averageProcessingTime,
      failureRate,
    };

    return {
      volume,
      value,
      performance,
    };
  }

  /**
   * Limpia logs antiguos
   */
  async cleanupOldLogs(tenantId: string, daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    let removedCount = 0;

    // Limpiar logs de pagos
    const paymentLogs = this.paymentLogs.get(tenantId) || [];
    const filteredPaymentLogs = paymentLogs.filter(log => {
      if (log.createdAt < cutoffDate) {
        removedCount++;
        return false;
      }
      return true;
    });
    this.paymentLogs.set(tenantId, filteredPaymentLogs);

    // Limpiar logs de reembolsos
    const refundLogs = this.refundLogs.get(tenantId) || [];
    const filteredRefundLogs = refundLogs.filter(log => {
      if (log.createdAt < cutoffDate) {
        removedCount++;
        return false;
      }
      return true;
    });
    this.refundLogs.set(tenantId, filteredRefundLogs);

    // Limpiar logs de webhooks
    const webhookLogs = this.webhookLogs.get(tenantId) || [];
    const filteredWebhookLogs = webhookLogs.filter(log => {
      if (log.receivedAt < cutoffDate) {
        removedCount++;
        return false;
      }
      return true;
    });
    this.webhookLogs.set(tenantId, filteredWebhookLogs);

    this.logger.log(`Limpieza completada para tenant ${tenantId}: ${removedCount} logs eliminados`);
    
    return removedCount;
  }
}
