import { Injectable, Logger } from '@nestjs/common';
import { JobQueue } from './jobQueue';
import { JobProcessor } from './jobProcessor';
import { JobScheduler } from './jobScheduler';
import { JobRetryService } from './services/jobRetry.service';
import { JobLogService } from './services/jobLog.service';
import { 
  Job, 
  JobType, 
  JobPriority, 
  ScheduledJob,
  CreateJobDto,
  ScheduleJobDto,
  JobStats,
  JobLog 
} from './interfaces';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);
  private isProcessing = false;

  constructor(
    private readonly jobQueue: JobQueue,
    private readonly jobProcessor: JobProcessor,
    private readonly jobScheduler: JobScheduler,
    private readonly jobRetryService: JobRetryService,
    private readonly jobLogService: JobLogService,
  ) {
    this.startJobProcessor();
  }

  /**
   * Crea un nuevo trabajo
   */
  async createJob(createJobDto: CreateJobDto): Promise<Job> {
    this.logger.log(`Creando trabajo: ${createJobDto.type} para tenant: ${createJobDto.tenantId}`);

    // Validar datos del trabajo
    const validation = this.jobProcessor.validateJob({
      id: '',
      type: createJobDto.type,
      tenantId: createJobDto.tenantId,
      data: createJobDto.data,
      priority: createJobDto.priority || 'normal',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    if (!validation.isValid) {
      throw new Error(`Datos de trabajo inválidos: ${validation.errors.join(', ')}`);
    }

    // Crear trabajo
    const job = await this.jobQueue.enqueue({
      type: createJobDto.type,
      tenantId: createJobDto.tenantId,
      data: createJobDto.data,
      priority: createJobDto.priority || 'normal',
    });

    // Log del trabajo
    await this.jobLogService.logJob(job, 'created');

    this.logger.log(`Trabajo creado exitosamente: ${job.id}`);
    
    return job;
  }

  /**
   * Programa un trabajo recurrente
   */
  async scheduleJob(scheduleJobDto: ScheduleJobDto): Promise<void> {
    this.logger.log(`Programando trabajo: ${scheduleJobDto.jobType} para tenant: ${scheduleJobDto.tenantId}`);

    // Programar trabajo
    this.jobScheduler.scheduleJob({
      id: scheduleJobDto.id,
      tenantId: scheduleJobDto.tenantId,
      jobType: scheduleJobDto.jobType,
      schedule: scheduleJobDto.schedule,
      data: scheduleJobDto.data,
      priority: scheduleJobDto.priority || 'normal',
      isActive: scheduleJobDto.isActive !== false,
    });

    this.logger.log(`Trabajo programado exitosamente: ${scheduleJobDto.id}`);
  }

  /**
   * Obtiene el estado de un trabajo
   */
  async getJobStatus(jobId: string): Promise<Job | null> {
    // Buscar en todas las colas y estados
    const allJobs = [
      ...this.jobQueue.getPendingJobs('default'),
      ...this.jobQueue.getCompletedJobs(),
      ...this.jobQueue.getFailedJobs(),
    ];

    return allJobs.find(job => job.id === jobId) || null;
  }

  /**
   * Cancela un trabajo
   */
  async cancelJob(jobId: string): Promise<void> {
    this.logger.log(`Cancelando trabajo: ${jobId}`);

    // Marcar como cancelado en la cola
    await this.jobQueue.failJob(jobId, 'Cancelled by user', false);

    // Log del trabajo
    const job = await this.getJobStatus(jobId);
    if (job) {
      await this.jobLogService.logJob(job, 'cancelled');
    }

    this.logger.log(`Trabajo cancelado exitosamente: ${jobId}`);
  }

  /**
   * Reintenta un trabajo fallido
   */
  async retryJob(jobId: string): Promise<Job | null> {
    this.logger.log(`Reintentando trabajo: ${jobId}`);

    const retryJob = await this.jobQueue.retryJob(jobId);
    
    if (retryJob) {
      await this.jobLogService.logJob(retryJob, 'retried');
      this.logger.log(`Trabajo programado para reintento: ${retryJob.id}`);
    } else {
      this.logger.warn(`No se pudo reintentar el trabajo: ${jobId}`);
    }

    return retryJob;
  }

  /**
   * Obtiene trabajos de un tenant
   */
  async getJobs(
    tenantId: string,
    status?: 'pending' | 'processing' | 'completed' | 'failed',
    type?: JobType,
    limit: number = 50,
    offset: number = 0
  ): Promise<Job[]> {
    this.logger.log(`Obteniendo trabajos para tenant: ${tenantId}`);

    let jobs: Job[] = [];

    switch (status) {
      case 'pending':
        // Obtener de todas las colas
        for (const queueName of this.jobQueue['queues'].keys()) {
          jobs.push(...this.jobQueue.getPendingJobs(queueName));
        }
        jobs = jobs.filter(job => job.tenantId === tenantId);
        break;
      
      case 'completed':
        jobs = this.jobQueue.getCompletedJobs(tenantId);
        break;
      
      case 'failed':
        jobs = this.jobQueue.getFailedJobs(tenantId);
        break;
      
      default:
        // Obtener todos los trabajos
        jobs = [
          ...this.jobQueue.getCompletedJobs(tenantId),
          ...this.jobQueue.getFailedJobs(tenantId),
        ];
        break;
    }

    // Filtrar por tipo si se especifica
    if (type) {
      jobs = jobs.filter(job => job.type === type);
    }

    // Ordenar por fecha de creación (más recientes primero)
    jobs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Aplicar paginación
    return jobs.slice(offset, offset + limit);
  }

  /**
   * Obtiene trabajos programados
   */
  async getScheduledJobs(tenantId?: string): Promise<ScheduledJob[]> {
    return this.jobScheduler.getScheduledJobs(tenantId);
  }

  /**
   * Activa un trabajo programado
   */
  async activateScheduledJob(jobId: string): Promise<void> {
    this.jobScheduler.activateScheduledJob(jobId);
    this.logger.log(`Trabajo programado activado: ${jobId}`);
  }

  /**
   * Desactiva un trabajo programado
   */
  async deactivateScheduledJob(jobId: string): Promise<void> {
    this.jobScheduler.deactivateScheduledJob(jobId);
    this.logger.log(`Trabajo programado desactivado: ${jobId}`);
  }

  /**
   * Ejecuta un trabajo programado inmediatamente
   */
  async executeScheduledJob(jobId: string): Promise<Job | null> {
    this.logger.log(`Ejecutando trabajo programado: ${jobId}`);
    
    const job = await this.jobScheduler.executeScheduledJob(jobId);
    
    if (job) {
      await this.jobLogService.logJob(job, 'executed');
    }

    return job;
  }

  /**
   * Obtiene estadísticas de trabajos
   */
  async getJobStats(tenantId?: string): Promise<JobStats> {
    this.logger.log(`Obteniendo estadísticas de trabajos para tenant: ${tenantId || 'global'}`);
    
    const queueStats = this.jobQueue.getJobStats(tenantId);
    const schedulingStats = this.jobScheduler.getSchedulingStats();
    const retryStats = this.jobRetryService.getRetryStats(tenantId);

    return {
      tenantId: tenantId || 'global',
      totalJobs: queueStats.total,
      pendingJobs: queueStats.pending,
      processingJobs: queueStats.processing,
      completedJobs: queueStats.completed,
      failedJobs: queueStats.failed,
      scheduledJobs: schedulingStats.totalScheduled,
      activeScheduledJobs: schedulingStats.activeJobs,
      byType: queueStats.byType,
      averageProcessingTime: queueStats.averageProcessingTime,
      retryStats,
      lastUpdated: new Date(),
    };
  }

  /**
   * Obtiene logs de trabajos
   */
  async getJobLogs(
    tenantId: string,
    limit: number = 50,
    offset: number = 0,
    jobType?: JobType
  ): Promise<JobLog[]> {
    this.logger.log(`Obteniendo logs de trabajos para tenant: ${tenantId}`);
    return await this.jobLogService.getJobLogs(tenantId, limit, offset, jobType);
  }

  /**
   * Limpia trabajos antiguos
   */
  async cleanupOldJobs(tenantId: string, daysToKeep: number = 7): Promise<number> {
    this.logger.log(`Limpiando trabajos antiguos para tenant: ${tenantId}`);
    
    const removedCount = await this.jobQueue.cleanupOldJobs(tenantId, daysToKeep);
    await this.jobLogService.cleanupOldLogs(tenantId, daysToKeep);

    this.logger.log(`Limpieza completada: ${removedCount} trabajos eliminados`);
    
    return removedCount;
  }

  /**
   * Reprocesa trabajos fallidos
   */
  async reprocessFailedJobs(tenantId: string, jobType?: JobType): Promise<number> {
    this.logger.log(`Reprocesando trabajos fallidos para tenant: ${tenantId}`);
    
    const processedCount = await this.jobRetryService.reprocessFailedJobs(tenantId, jobType);
    
    this.logger.log(`Reprocesamiento completado: ${processedCount} trabajos procesados`);
    
    return processedCount;
  }

  /**
   * Obtiene tipos de trabajos disponibles
   */
  getAvailableJobTypes(): Array<{
    type: JobType;
    description: string;
    estimatedTime: string;
  }> {
    return this.jobProcessor.getAvailableProcessors();
  }

  /**
   * Obtiene estado de las colas
   */
  getQueueStatus(): Record<string, {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  }> {
    return this.jobQueue.getQueueStatus();
  }

  /**
   * Health check del servicio
   */
  async healthCheck(): Promise<{
    status: string;
    timestamp: string;
    queues: number;
    processors: number;
    scheduledJobs: number;
  }> {
    const queueStatus = this.jobQueue.getQueueStatus();
    const processorStats = this.jobProcessor.getProcessingStats();
    const schedulingStats = this.jobScheduler.getSchedulingStats();

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      queues: Object.keys(queueStatus).length,
      processors: processorStats.totalProcessors,
      scheduledJobs: schedulingStats.totalScheduled,
    };
  }

  /**
   * Inicia el procesador de trabajos
   */
  private startJobProcessor(): void {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    
    // Procesar trabajos cada 5 segundos
    setInterval(async () => {
      await this.processJobs();
    }, 5000);

    this.logger.log('Procesador de trabajos iniciado');
  }

  /**
   * Procesa trabajos pendientes
   */
  private async processJobs(): Promise<void> {
    const queueNames = ['webhook-retry', 'payment-sync', 'delivery-sync', 'message-retry', 'cleanup', 'report', 'notification'];
    
    for (const queueName of queueNames) {
      try {
        const job = await this.jobQueue.dequeue(queueName);
        if (job) {
          await this.processJob(job);
        }
      } catch (error) {
        this.logger.error(`Error procesando cola ${queueName}: ${error.message}`);
      }
    }
  }

  /**
   * Procesa un trabajo individual
   */
  private async processJob(job: Job): Promise<void> {
    try {
      this.logger.log(`Procesando trabajo: ${job.id} (${job.type})`);
      
      await this.jobLogService.logJob(job, 'processing');
      
      const result = await this.jobProcessor.processJob(job);
      
      await this.jobQueue.completeJob(job.id, result);
      await this.jobLogService.logJob(job, 'completed', result);
      
      this.logger.log(`Trabajo completado exitosamente: ${job.id}`);
      
    } catch (error) {
      this.logger.error(`Error procesando trabajo ${job.id}: ${error.message}`);
      
      await this.jobQueue.failJob(job.id, error.message, true);
      await this.jobLogService.logJob(job, 'failed', null, error.message);
      
      // Programar reintento si es necesario
      await this.jobRetryService.scheduleRetry(job, error.message);
    }
  }
}
