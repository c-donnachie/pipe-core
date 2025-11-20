import { Injectable, Logger } from '@nestjs/common';
import { WebhookLog, WebhookStats, WebhookDeliveryLog, WebhookEvent } from '../interfaces';

@Injectable()
export class WebhookLogService {
  private readonly logger = new Logger(WebhookLogService.name);
  private webhookLogs: Map<string, WebhookLog[]> = new Map();
  private eventLogs: Map<string, WebhookEvent[]> = new Map();

  /**
   * Log de un evento de webhook
   */
  async logEvent(event: WebhookEvent): Promise<void> {
    const tenantLogs = this.eventLogs.get(event.tenantId) || [];
    tenantLogs.push(event);
    this.eventLogs.set(event.tenantId, tenantLogs);

    this.logger.log(`Evento loggeado: ${event.eventType} para tenant: ${event.tenantId}`);
  }

  /**
   * Log de entrega de webhook
   */
  async logWebhookDelivery(deliveryLog: Omit<WebhookLog, 'id'>): Promise<WebhookLog> {
    const id = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const log: WebhookLog = {
      ...deliveryLog,
      id,
    };

    const tenantLogs = this.webhookLogs.get(deliveryLog.tenantId) || [];
    tenantLogs.push(log);
    this.webhookLogs.set(deliveryLog.tenantId, tenantLogs);

    this.logger.log(`Entrega de webhook loggeada: ${deliveryLog.eventId} para tenant: ${deliveryLog.tenantId}`);
    return log;
  }

  /**
   * Obtiene logs de webhooks de un tenant
   */
  async getWebhookLogs(
    tenantId: string,
    limit: number = 50,
    offset: number = 0,
    eventType?: string,
    status?: string
  ): Promise<WebhookLog[]> {
    let logs = this.webhookLogs.get(tenantId) || [];

    // Filtrar por tipo de evento
    if (eventType) {
      logs = logs.filter(log => log.eventType === eventType);
    }

    // Filtrar por estado
    if (status) {
      logs = logs.filter(log => log.status === status);
    }

    // Ordenar por fecha de entrega (más recientes primero)
    logs.sort((a, b) => b.deliveredAt.getTime() - a.deliveredAt.getTime());

    // Aplicar paginación
    return logs.slice(offset, offset + limit);
  }

  /**
   * Obtiene estadísticas de webhooks de un tenant
   */
  async getWebhookStats(tenantId: string, period: 'day' | 'week' | 'month' = 'day'): Promise<WebhookStats> {
    const logs = this.webhookLogs.get(tenantId) || [];
    
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
    const periodLogs = logs.filter(log => log.deliveredAt >= startDate);

    // Calcular estadísticas básicas
    const totalEvents = periodLogs.length;
    const successfulDeliveries = periodLogs.filter(log => log.status === 'delivered').length;
    const failedDeliveries = periodLogs.filter(log => log.status === 'failed').length;
    const averageResponseTime = periodLogs.length > 0 
      ? periodLogs.reduce((sum, log) => sum + log.responseTime, 0) / periodLogs.length 
      : 0;
    const successRate = totalEvents > 0 ? (successfulDeliveries / totalEvents) * 100 : 0;

    // Estadísticas por tipo de evento
    const byEventType: Record<string, { count: number; successRate: number; averageResponseTime: number }> = {};
    const eventTypes = [...new Set(periodLogs.map(log => log.eventType))];
    
    eventTypes.forEach(eventType => {
      const eventLogs = periodLogs.filter(log => log.eventType === eventType);
      const successful = eventLogs.filter(log => log.status === 'delivered').length;
      const avgResponseTime = eventLogs.length > 0 
        ? eventLogs.reduce((sum, log) => sum + log.responseTime, 0) / eventLogs.length 
        : 0;
      
      byEventType[eventType] = {
        count: eventLogs.length,
        successRate: eventLogs.length > 0 ? (successful / eventLogs.length) * 100 : 0,
        averageResponseTime: avgResponseTime,
      };
    });

    // Estadísticas por estado
    const byStatus: Record<string, number> = {};
    periodLogs.forEach(log => {
      byStatus[log.status] = (byStatus[log.status] || 0) + 1;
    });

    // Estadísticas de reintentos
    const retryStats = {
      totalRetries: periodLogs.reduce((sum, log) => sum + log.retryCount, 0),
      successfulRetries: periodLogs
        .filter(log => log.retryCount > 0 && log.status === 'delivered')
        .reduce((sum, log) => sum + log.retryCount, 0),
      failedRetries: periodLogs
        .filter(log => log.retryCount > 0 && log.status === 'failed')
        .reduce((sum, log) => sum + log.retryCount, 0),
      averageRetryCount: periodLogs.length > 0 
        ? periodLogs.reduce((sum, log) => sum + log.retryCount, 0) / periodLogs.length 
        : 0,
    };

    const stats: WebhookStats = {
      tenantId,
      period,
      startDate,
      endDate: now,
      totalEvents,
      successfulDeliveries,
      failedDeliveries,
      averageResponseTime,
      successRate,
      byEventType,
      byStatus,
      retryStats,
    };

    this.logger.log(`Estadísticas de webhooks generadas para tenant ${tenantId}: ${totalEvents} eventos en período ${period}`);
    
    return stats;
  }

  /**
   * Obtiene métricas de rendimiento
   */
  async getPerformanceMetrics(tenantId: string, period: 'hour' | 'day' | 'week'): Promise<{
    totalEvents: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    averageResponseTime: number;
    successRate: number;
    byEventType: Record<string, { count: number; successRate: number }>;
  }> {
    const logs = this.webhookLogs.get(tenantId) || [];
    
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
    }

    // Filtrar logs del período
    const periodLogs = logs.filter(log => log.deliveredAt >= startDate);

    // Métricas básicas
    const totalEvents = periodLogs.length;
    const successfulDeliveries = periodLogs.filter(log => log.status === 'delivered').length;
    const failedDeliveries = periodLogs.filter(log => log.status === 'failed').length;
    const averageResponseTime = periodLogs.length > 0 
      ? periodLogs.reduce((sum, log) => sum + log.responseTime, 0) / periodLogs.length 
      : 0;
    const successRate = totalEvents > 0 ? (successfulDeliveries / totalEvents) * 100 : 0;

    // Métricas por tipo de evento
    const byEventType: Record<string, { count: number; successRate: number }> = {};
    const eventTypes = [...new Set(periodLogs.map(log => log.eventType))];
    
    eventTypes.forEach(eventType => {
      const eventLogs = periodLogs.filter(log => log.eventType === eventType);
      const successful = eventLogs.filter(log => log.status === 'delivered').length;
      
      byEventType[eventType] = {
        count: eventLogs.length,
        successRate: eventLogs.length > 0 ? (successful / eventLogs.length) * 100 : 0,
      };
    });

    return {
      totalEvents,
      successfulDeliveries,
      failedDeliveries,
      averageResponseTime,
      successRate,
      byEventType,
    };
  }

  /**
   * Obtiene eventos de un tenant
   */
  async getEvents(
    tenantId: string,
    limit: number = 50,
    offset: number = 0,
    eventType?: string
  ): Promise<WebhookEvent[]> {
    let events = this.eventLogs.get(tenantId) || [];

    // Filtrar por tipo de evento
    if (eventType) {
      events = events.filter(event => event.eventType === eventType);
    }

    // Ordenar por timestamp (más recientes primero)
    events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Aplicar paginación
    return events.slice(offset, offset + limit);
  }

  /**
   * Obtiene logs de un evento específico
   */
  async getEventLogs(eventId: string): Promise<WebhookLog[]> {
    const allLogs: WebhookLog[] = [];
    
    for (const logs of this.webhookLogs.values()) {
      allLogs.push(...logs.filter(log => log.eventId === eventId));
    }

    // Ordenar por fecha de entrega
    allLogs.sort((a, b) => a.deliveredAt.getTime() - b.deliveredAt.getTime());

    return allLogs;
  }

  /**
   * Actualiza el estado de un log de webhook
   */
  async updateWebhookLogStatus(
    logId: string,
    status: 'delivered' | 'failed' | 'retrying',
    responseTime?: number,
    responseStatus?: number,
    errorMessage?: string
  ): Promise<void> {
    for (const [tenantId, logs] of this.webhookLogs.entries()) {
      const logIndex = logs.findIndex(log => log.id === logId);
      if (logIndex >= 0) {
        logs[logIndex].status = status;
        if (responseTime !== undefined) logs[logIndex].responseTime = responseTime;
        if (responseStatus !== undefined) logs[logIndex].responseStatus = responseStatus;
        if (errorMessage !== undefined) logs[logIndex].errorMessage = errorMessage;
        
        this.logger.log(`Estado de log de webhook actualizado: ${logId} -> ${status}`);
        return;
      }
    }
    
    this.logger.warn(`Log de webhook no encontrado para actualizar estado: ${logId}`);
  }

  /**
   * Incrementa el contador de reintentos de un log
   */
  async incrementRetryCount(logId: string, nextRetryAt?: Date): Promise<void> {
    for (const [tenantId, logs] of this.webhookLogs.entries()) {
      const logIndex = logs.findIndex(log => log.id === logId);
      if (logIndex >= 0) {
        logs[logIndex].retryCount += 1;
        logs[logIndex].status = 'retrying';
        if (nextRetryAt) logs[logIndex].nextRetryAt = nextRetryAt;
        
        this.logger.log(`Contador de reintentos incrementado para log: ${logId}`);
        return;
      }
    }
    
    this.logger.warn(`Log de webhook no encontrado para incrementar reintentos: ${logId}`);
  }

  /**
   * Obtiene logs con errores recientes
   */
  async getRecentErrors(tenantId: string, hours: number = 24): Promise<WebhookLog[]> {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hours);

    const logs = this.webhookLogs.get(tenantId) || [];
    return logs.filter(log => 
      log.status === 'failed' && 
      log.deliveredAt >= cutoffTime
    );
  }

  /**
   * Obtiene logs que necesitan reintento
   */
  async getLogsNeedingRetry(tenantId: string, maxRetries: number = 3): Promise<WebhookLog[]> {
    const now = new Date();
    const logs = this.webhookLogs.get(tenantId) || [];
    
    return logs.filter(log => 
      log.status === 'failed' && 
      log.retryCount < maxRetries &&
      (!log.nextRetryAt || log.nextRetryAt <= now)
    );
  }

  /**
   * Limpia logs antiguos
   */
  async cleanupOldLogs(tenantId: string, daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    let removedCount = 0;

    // Limpiar logs de webhooks
    const webhookLogs = this.webhookLogs.get(tenantId) || [];
    const filteredWebhookLogs = webhookLogs.filter(log => {
      if (log.deliveredAt < cutoffDate) {
        removedCount++;
        return false;
      }
      return true;
    });
    this.webhookLogs.set(tenantId, filteredWebhookLogs);

    // Limpiar logs de eventos
    const eventLogs = this.eventLogs.get(tenantId) || [];
    const filteredEventLogs = eventLogs.filter(event => {
      if (event.timestamp < cutoffDate) {
        removedCount++;
        return false;
      }
      return true;
    });
    this.eventLogs.set(tenantId, filteredEventLogs);

    this.logger.log(`Limpieza completada para tenant ${tenantId}: ${removedCount} logs eliminados`);
    
    return removedCount;
  }

  /**
   * Obtiene resumen de actividad por hora
   */
  async getHourlyActivity(tenantId: string, hours: number = 24): Promise<Record<string, {
    events: number;
    successful: number;
    failed: number;
    averageResponseTime: number;
  }>> {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hours);

    const logs = this.webhookLogs.get(tenantId) || [];
    const recentLogs = logs.filter(log => log.deliveredAt >= cutoffTime);

    const hourlyActivity: Record<string, {
      events: number;
      successful: number;
      failed: number;
      averageResponseTime: number;
    }> = {};

    recentLogs.forEach(log => {
      const hour = log.deliveredAt.toISOString().substring(0, 13); // YYYY-MM-DDTHH
      
      if (!hourlyActivity[hour]) {
        hourlyActivity[hour] = {
          events: 0,
          successful: 0,
          failed: 0,
          averageResponseTime: 0,
        };
      }

      hourlyActivity[hour].events++;
      if (log.status === 'delivered') {
        hourlyActivity[hour].successful++;
      } else if (log.status === 'failed') {
        hourlyActivity[hour].failed++;
      }
      hourlyActivity[hour].averageResponseTime += log.responseTime;
    });

    // Calcular promedios
    Object.keys(hourlyActivity).forEach(hour => {
      const activity = hourlyActivity[hour];
      activity.averageResponseTime = activity.events > 0 
        ? activity.averageResponseTime / activity.events 
        : 0;
    });

    return hourlyActivity;
  }
}
