import { Injectable, Logger } from '@nestjs/common';
import { Job, JobType, ScheduledJob, JobSchedule } from './interfaces';

@Injectable()
export class JobScheduler {
  private readonly logger = new Logger(JobScheduler.name);
  private scheduledJobs: Map<string, ScheduledJob> = new Map();
  private cronJobs: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.initializeDefaultSchedules();
  }

  /**
   * Inicializa horarios por defecto
   */
  private initializeDefaultSchedules(): void {
    // Limpieza diaria a las 2 AM
    this.scheduleJob({
      id: 'daily-cleanup',
      tenantId: 'global',
      jobType: 'cleanup',
      schedule: {
        type: 'cron',
        expression: '0 2 * * *', // 2 AM todos los días
      },
      data: {
        dataType: 'logs',
        olderThan: 30, // días
      },
      priority: 'low',
      isActive: true,
    });

    // Reporte semanal los lunes a las 9 AM
    this.scheduleJob({
      id: 'weekly-report',
      tenantId: 'global',
      jobType: 'report',
      schedule: {
        type: 'cron',
        expression: '0 9 * * 1', // Lunes a las 9 AM
      },
      data: {
        reportType: 'weekly',
        period: 'week',
      },
      priority: 'normal',
      isActive: true,
    });

    // Sincronización de pagos cada 15 minutos
    this.scheduleJob({
      id: 'payment-sync',
      tenantId: 'global',
      jobType: 'payment-sync',
      schedule: {
        type: 'interval',
        interval: 15 * 60 * 1000, // 15 minutos en ms
      },
      data: {
        syncType: 'pending',
      },
      priority: 'normal',
      isActive: true,
    });

    // Reintento de webhooks cada 5 minutos
    this.scheduleJob({
      id: 'webhook-retry',
      tenantId: 'global',
      jobType: 'webhook-retry',
      schedule: {
        type: 'interval',
        interval: 5 * 60 * 1000, // 5 minutos en ms
      },
      data: {
        retryType: 'failed',
        maxRetries: 3,
      },
      priority: 'high',
      isActive: true,
    });

    this.logger.log(`${this.scheduledJobs.size} trabajos programados inicializados`);
  }

  /**
   * Programa un trabajo recurrente
   */
  scheduleJob(scheduledJob: Omit<ScheduledJob, 'nextRun' | 'lastRun' | 'createdAt' | 'updatedAt'>): void {
    const newScheduledJob: ScheduledJob = {
      ...scheduledJob,
      nextRun: this.calculateNextRun(scheduledJob.schedule),
      lastRun: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.scheduledJobs.set(scheduledJob.id, newScheduledJob);
    this.createCronJob(newScheduledJob);

    this.logger.log(`Trabajo programado: ${scheduledJob.id} (${scheduledJob.jobType})`);
  }

  /**
   * Desprograma un trabajo
   */
  unscheduleJob(jobId: string): void {
    const scheduledJob = this.scheduledJobs.get(jobId);
    if (!scheduledJob) {
      this.logger.warn(`Trabajo programado no encontrado: ${jobId}`);
      return;
    }

    const cronJob = this.cronJobs.get(jobId);
    if (cronJob) {
      clearInterval(cronJob);
      this.cronJobs.delete(jobId);
    }

    this.scheduledJobs.delete(jobId);
    this.logger.log(`Trabajo desprogramado: ${jobId}`);
  }

  /**
   * Activa un trabajo programado
   */
  activateScheduledJob(jobId: string): void {
    const scheduledJob = this.scheduledJobs.get(jobId);
    if (!scheduledJob) {
      this.logger.warn(`Trabajo programado no encontrado: ${jobId}`);
      return;
    }

    scheduledJob.isActive = true;
    scheduledJob.updatedAt = new Date();
    
    if (!this.cronJobs.has(jobId)) {
      this.createCronJob(scheduledJob);
    }

    this.logger.log(`Trabajo programado activado: ${jobId}`);
  }

  /**
   * Desactiva un trabajo programado
   */
  deactivateScheduledJob(jobId: string): void {
    const scheduledJob = this.scheduledJobs.get(jobId);
    if (!scheduledJob) {
      this.logger.warn(`Trabajo programado no encontrado: ${jobId}`);
      return;
    }

    scheduledJob.isActive = false;
    scheduledJob.updatedAt = new Date();

    const cronJob = this.cronJobs.get(jobId);
    if (cronJob) {
      clearInterval(cronJob);
      this.cronJobs.delete(jobId);
    }

    this.logger.log(`Trabajo programado desactivado: ${jobId}`);
  }

  /**
   * Ejecuta un trabajo programado inmediatamente
   */
  async executeScheduledJob(jobId: string): Promise<Job | null> {
    const scheduledJob = this.scheduledJobs.get(jobId);
    if (!scheduledJob) {
      this.logger.warn(`Trabajo programado no encontrado: ${jobId}`);
      return null;
    }

    // Crear trabajo basado en el programado
    const job: Job = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: scheduledJob.jobType,
      tenantId: scheduledJob.tenantId,
      data: scheduledJob.data,
      priority: scheduledJob.priority,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      scheduledJobId: jobId,
    };

    // Actualizar último tiempo de ejecución
    scheduledJob.lastRun = new Date();
    scheduledJob.nextRun = this.calculateNextRun(scheduledJob.schedule);
    scheduledJob.updatedAt = new Date();

    this.logger.log(`Trabajo programado ejecutado manualmente: ${jobId}`);
    
    return job;
  }

  /**
   * Obtiene trabajos programados
   */
  getScheduledJobs(tenantId?: string): ScheduledJob[] {
    const jobs = Array.from(this.scheduledJobs.values());
    
    if (tenantId) {
      return jobs.filter(job => job.tenantId === tenantId || job.tenantId === 'global');
    }
    
    return jobs;
  }

  /**
   * Obtiene trabajos programados activos
   */
  getActiveScheduledJobs(tenantId?: string): ScheduledJob[] {
    return this.getScheduledJobs(tenantId).filter(job => job.isActive);
  }

  /**
   * Obtiene trabajos que deben ejecutarse pronto
   */
  getUpcomingJobs(minutes: number = 60): ScheduledJob[] {
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() + minutes);

    return Array.from(this.scheduledJobs.values()).filter(job => 
      job.isActive && job.nextRun && job.nextRun <= cutoffTime
    );
  }

  /**
   * Obtiene estadísticas de trabajos programados
   */
  getSchedulingStats(): {
    totalScheduled: number;
    activeJobs: number;
    inactiveJobs: number;
    byType: Record<JobType, number>;
    nextExecution: Date | null;
  } {
    const jobs = Array.from(this.scheduledJobs.values());
    
    const stats = {
      totalScheduled: jobs.length,
      activeJobs: jobs.filter(job => job.isActive).length,
      inactiveJobs: jobs.filter(job => !job.isActive).length,
      byType: {} as Record<JobType, number>,
      nextExecution: null as Date | null,
    };

    // Contar por tipo
    jobs.forEach(job => {
      stats.byType[job.jobType] = (stats.byType[job.jobType] || 0) + 1;
    });

    // Encontrar próxima ejecución
    const activeJobs = jobs.filter(job => job.isActive && job.nextRun);
    if (activeJobs.length > 0) {
      stats.nextExecution = activeJobs.reduce((earliest, job) => 
        job.nextRun! < earliest.nextRun! ? job : earliest
      ).nextRun!;
    }

    return stats;
  }

  /**
   * Calcula el próximo tiempo de ejecución
   */
  private calculateNextRun(schedule: JobSchedule): Date {
    const now = new Date();

    switch (schedule.type) {
      case 'interval':
        return new Date(now.getTime() + schedule.interval);
      
      case 'cron':
        return this.parseCronExpression(schedule.expression);
      
      case 'once':
        return new Date(schedule.dateTime);
      
      default:
        throw new Error(`Tipo de programación no soportado: ${schedule.type}`);
    }
  }

  /**
   * Parsea una expresión cron básica
   */
  private parseCronExpression(expression: string): Date {
    // Implementación básica de cron parser
    // En una implementación real, usaría una librería como node-cron
    const parts = expression.split(' ');
    if (parts.length !== 5) {
      throw new Error('Expresión cron inválida');
    }

    const [minute, hour, day, month, weekday] = parts;
    const now = new Date();
    const nextRun = new Date(now);

    // Lógica básica para calcular próxima ejecución
    if (minute !== '*') {
      nextRun.setMinutes(parseInt(minute));
    }
    
    if (hour !== '*') {
      nextRun.setHours(parseInt(hour));
    }

    // Si la hora ya pasó hoy, programar para mañana
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    return nextRun;
  }

  /**
   * Crea un trabajo cron
   */
  private createCronJob(scheduledJob: ScheduledJob): void {
    if (!scheduledJob.isActive) {
      return;
    }

    let interval: number;

    switch (scheduledJob.schedule.type) {
      case 'interval':
        interval = scheduledJob.schedule.interval;
        break;
      
      case 'cron':
        // Para cron, usar el intervalo hasta la próxima ejecución
        interval = scheduledJob.nextRun!.getTime() - Date.now();
        if (interval < 1000) interval = 60000; // Mínimo 1 minuto
        break;
      
      default:
        return;
    }

    const cronJob = setInterval(() => {
      this.executeScheduledJob(scheduledJob.id);
    }, interval);

    this.cronJobs.set(scheduledJob.id, cronJob);
  }

  /**
   * Limpia trabajos cron inactivos
   */
  cleanupInactiveCronJobs(): void {
    for (const [jobId, cronJob] of this.cronJobs.entries()) {
      const scheduledJob = this.scheduledJobs.get(jobId);
      
      if (!scheduledJob || !scheduledJob.isActive) {
        clearInterval(cronJob);
        this.cronJobs.delete(jobId);
        this.logger.log(`Trabajo cron inactivo limpiado: ${jobId}`);
      }
    }
  }

  /**
   * Health check del scheduler
   */
  healthCheck(): { status: string; scheduledJobs: number; activeCronJobs: number; timestamp: string } {
    return {
      status: 'healthy',
      scheduledJobs: this.scheduledJobs.size,
      activeCronJobs: this.cronJobs.size,
      timestamp: new Date().toISOString(),
    };
  }
}
