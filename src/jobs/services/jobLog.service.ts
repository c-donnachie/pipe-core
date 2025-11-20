import { Injectable, Logger } from '@nestjs/common';
import { Job, JobLog } from '../interfaces';

@Injectable()
export class JobLogService {
  private readonly logger = new Logger(JobLogService.name);
  private jobLogs: Map<string, JobLog[]> = new Map();

  /**
   * Log de un trabajo
   */
  async logJob(
    job: Job, 
    action: 'created' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'retried' | 'executed',
    result?: any,
    errorMessage?: string
  ): Promise<JobLog> {
    const log: JobLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      jobId: job.id,
      tenantId: job.tenantId,
      action,
      details: result ? { result } : undefined,
      errorMessage,
      timestamp: new Date(),
      processingTime: result?.processingTime,
    };

    const tenantLogs = this.jobLogs.get(job.tenantId) || [];
    tenantLogs.push(log);
    
    // Mantener solo los últimos 1000 logs por tenant
    if (tenantLogs.length > 1000) {
      tenantLogs.splice(0, tenantLogs.length - 1000);
    }
    
    this.jobLogs.set(job.tenantId, tenantLogs);

    this.logger.log(`Log de trabajo creado: ${job.id} - ${action}`);
    
    return log;
  }

  /**
   * Obtiene logs de trabajos de un tenant
   */
  async getJobLogs(
    tenantId: string,
    limit: number = 50,
    offset: number = 0,
    jobType?: string
  ): Promise<JobLog[]> {
    let logs = this.jobLogs.get(tenantId) || [];

    // Filtrar por tipo de trabajo si se especifica
    if (jobType) {
      logs = logs.filter(log => {
        // Aquí necesitaríamos acceso al trabajo original para obtener el tipo
        // Por simplicidad, no filtramos por tipo en esta implementación
        return true;
      });
    }

    // Ordenar por timestamp (más recientes primero)
    logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Aplicar paginación
    return logs.slice(offset, offset + limit);
  }

  /**
   * Obtiene logs de un trabajo específico
   */
  async getJobLogsById(jobId: string): Promise<JobLog[]> {
    const allLogs: JobLog[] = [];
    
    for (const logs of this.jobLogs.values()) {
      allLogs.push(...logs.filter(log => log.jobId === jobId));
    }

    // Ordenar por timestamp
    allLogs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return allLogs;
  }

  /**
   * Obtiene estadísticas de logs
   */
  async getLogStats(tenantId: string, period: 'hour' | 'day' | 'week' = 'day'): Promise<{
    totalLogs: number;
    byAction: Record<string, number>;
    byJobType: Record<string, number>;
    averageProcessingTime: number;
    errorRate: number;
  }> {
    const logs = this.jobLogs.get(tenantId) || [];
    
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
    const periodLogs = logs.filter(log => log.timestamp >= startDate);

    // Calcular estadísticas
    const stats = {
      totalLogs: periodLogs.length,
      byAction: {} as Record<string, number>,
      byJobType: {} as Record<string, number>,
      averageProcessingTime: 0,
      errorRate: 0,
    };

    let totalProcessingTime = 0;
    let processingTimeCount = 0;
    let errorCount = 0;

    periodLogs.forEach(log => {
      // Contar por acción
      stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;

      // Contar errores
      if (log.errorMessage) {
        errorCount++;
      }

      // Calcular tiempo de procesamiento promedio
      if (log.processingTime) {
        totalProcessingTime += log.processingTime;
        processingTimeCount++;
      }
    });

    // Calcular promedios
    if (processingTimeCount > 0) {
      stats.averageProcessingTime = totalProcessingTime / processingTimeCount;
    }

    if (periodLogs.length > 0) {
      stats.errorRate = (errorCount / periodLogs.length) * 100;
    }

    return stats;
  }

  /**
   * Obtiene logs con errores
   */
  async getErrorLogs(tenantId: string, limit: number = 50): Promise<JobLog[]> {
    const logs = this.jobLogs.get(tenantId) || [];
    
    const errorLogs = logs.filter(log => log.errorMessage);
    
    // Ordenar por timestamp (más recientes primero)
    errorLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return errorLogs.slice(0, limit);
  }

  /**
   * Obtiene logs por acción específica
   */
  async getLogsByAction(
    tenantId: string,
    action: string,
    limit: number = 50
  ): Promise<JobLog[]> {
    const logs = this.jobLogs.get(tenantId) || [];
    
    const actionLogs = logs.filter(log => log.action === action);
    
    // Ordenar por timestamp (más recientes primero)
    actionLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return actionLogs.slice(0, limit);
  }

  /**
   * Obtiene métricas de rendimiento
   */
  async getPerformanceMetrics(tenantId: string, period: 'hour' | 'day' | 'week'): Promise<{
    totalJobs: number;
    completedJobs: number;
    failedJobs: number;
    averageProcessingTime: number;
    successRate: number;
    byAction: Record<string, { count: number; avgProcessingTime: number }>;
  }> {
    const logs = this.jobLogs.get(tenantId) || [];
    
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
    const periodLogs = logs.filter(log => log.timestamp >= startDate);

    const metrics = {
      totalJobs: 0,
      completedJobs: 0,
      failedJobs: 0,
      averageProcessingTime: 0,
      successRate: 0,
      byAction: {} as Record<string, { count: number; avgProcessingTime: number }>,
    };

    let totalProcessingTime = 0;
    let processingTimeCount = 0;

    periodLogs.forEach(log => {
      metrics.totalJobs++;

      // Contar trabajos completados y fallidos
      if (log.action === 'completed') {
        metrics.completedJobs++;
      } else if (log.action === 'failed') {
        metrics.failedJobs++;
      }

      // Calcular tiempo de procesamiento
      if (log.processingTime) {
        totalProcessingTime += log.processingTime;
        processingTimeCount++;

        // Agrupar por acción
        if (!metrics.byAction[log.action]) {
          metrics.byAction[log.action] = { count: 0, avgProcessingTime: 0 };
        }
        metrics.byAction[log.action].count++;
        metrics.byAction[log.action].avgProcessingTime += log.processingTime;
      }
    });

    // Calcular promedios
    if (processingTimeCount > 0) {
      metrics.averageProcessingTime = totalProcessingTime / processingTimeCount;
    }

    if (metrics.totalJobs > 0) {
      metrics.successRate = (metrics.completedJobs / metrics.totalJobs) * 100;
    }

    // Calcular promedios por acción
    Object.keys(metrics.byAction).forEach(action => {
      const actionData = metrics.byAction[action];
      if (actionData.count > 0) {
        actionData.avgProcessingTime = actionData.avgProcessingTime / actionData.count;
      }
    });

    return metrics;
  }

  /**
   * Obtiene actividad por hora
   */
  async getHourlyActivity(tenantId: string, hours: number = 24): Promise<Record<string, {
    total: number;
    completed: number;
    failed: number;
    averageProcessingTime: number;
  }>> {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hours);

    const logs = this.jobLogs.get(tenantId) || [];
    const recentLogs = logs.filter(log => log.timestamp >= cutoffTime);

    const hourlyActivity: Record<string, {
      total: number;
      completed: number;
      failed: number;
      averageProcessingTime: number;
    }> = {};

    recentLogs.forEach(log => {
      const hour = log.timestamp.toISOString().substring(0, 13); // YYYY-MM-DDTHH
      
      if (!hourlyActivity[hour]) {
        hourlyActivity[hour] = {
          total: 0,
          completed: 0,
          failed: 0,
          averageProcessingTime: 0,
        };
      }

      hourlyActivity[hour].total++;
      
      if (log.action === 'completed') {
        hourlyActivity[hour].completed++;
      } else if (log.action === 'failed') {
        hourlyActivity[hour].failed++;
      }

      if (log.processingTime) {
        hourlyActivity[hour].averageProcessingTime += log.processingTime;
      }
    });

    // Calcular promedios
    Object.keys(hourlyActivity).forEach(hour => {
      const activity = hourlyActivity[hour];
      if (activity.total > 0) {
        activity.averageProcessingTime = activity.averageProcessingTime / activity.total;
      }
    });

    return hourlyActivity;
  }

  /**
   * Limpia logs antiguos
   */
  async cleanupOldLogs(tenantId: string, daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const logs = this.jobLogs.get(tenantId) || [];
    const originalLength = logs.length;

    // Filtrar logs antiguos
    const filteredLogs = logs.filter(log => log.timestamp >= cutoffDate);
    
    this.jobLogs.set(tenantId, filteredLogs);
    
    const removedCount = originalLength - filteredLogs.length;
    
    if (removedCount > 0) {
      this.logger.log(`Limpieza de logs completada para tenant ${tenantId}: ${removedCount} logs eliminados`);
    }
    
    return removedCount;
  }

  /**
   * Obtiene resumen de actividad
   */
  async getActivitySummary(tenantId: string): Promise<{
    today: number;
    thisWeek: number;
    thisMonth: number;
    totalErrors: number;
    averageProcessingTime: number;
  }> {
    const logs = this.jobLogs.get(tenantId) || [];
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const summary = {
      today: logs.filter(log => log.timestamp >= today).length,
      thisWeek: logs.filter(log => log.timestamp >= thisWeek).length,
      thisMonth: logs.filter(log => log.timestamp >= thisMonth).length,
      totalErrors: logs.filter(log => log.errorMessage).length,
      averageProcessingTime: 0,
    };

    // Calcular tiempo promedio de procesamiento
    const logsWithProcessingTime = logs.filter(log => log.processingTime);
    if (logsWithProcessingTime.length > 0) {
      const totalTime = logsWithProcessingTime.reduce((sum, log) => sum + log.processingTime!, 0);
      summary.averageProcessingTime = totalTime / logsWithProcessingTime.length;
    }

    return summary;
  }

  /**
   * Health check del servicio de logs
   */
  healthCheck(): { status: string; totalLogs: number; tenants: number; timestamp: string } {
    let totalLogs = 0;
    for (const logs of this.jobLogs.values()) {
      totalLogs += logs.length;
    }

    return {
      status: 'healthy',
      totalLogs,
      tenants: this.jobLogs.size,
      timestamp: new Date().toISOString(),
    };
  }
}
