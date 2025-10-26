import { Injectable, Logger } from '@nestjs/common';
import { Job, JobPriority, JobStatus, JobType } from './interfaces';

@Injectable()
export class JobQueue {
  private readonly logger = new Logger(JobQueue.name);
  private queues: Map<string, Job[]> = new Map();
  private processingJobs: Map<string, Job> = new Map();
  private completedJobs: Map<string, Job[]> = new Map();
  private failedJobs: Map<string, Job[]> = new Map();

  constructor() {
    this.initializeQueues();
  }

  /**
   * Inicializa las colas por defecto
   */
  private initializeQueues(): void {
    // Colas por tipo de trabajo
    this.queues.set('webhook-retry', []);
    this.queues.set('payment-sync', []);
    this.queues.set('delivery-sync', []);
    this.queues.set('message-retry', []);
    this.queues.set('cleanup', []);
    this.queues.set('report', []);
    this.queues.set('notification', []);

    // Colas por tenant
    this.completedJobs.set('global', []);
    this.failedJobs.set('global', []);

    this.logger.log(`Colas de trabajos inicializadas: ${this.queues.size} colas`);
  }

  /**
   * Agrega un trabajo a la cola
   */
  async enqueue(job: Omit<Job, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<Job> {
    const newJob: Job = {
      ...job,
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const queueName = this.getQueueName(job.type);
    const queue = this.queues.get(queueName) || [];
    
    // Insertar según prioridad
    this.insertJobByPriority(queue, newJob);
    this.queues.set(queueName, queue);

    this.logger.log(`Trabajo agregado a la cola: ${newJob.id} (${job.type})`);
    
    return newJob;
  }

  /**
   * Obtiene el siguiente trabajo de una cola
   */
  async dequeue(queueName: string): Promise<Job | null> {
    const queue = this.queues.get(queueName);
    if (!queue || queue.length === 0) {
      return null;
    }

    const job = queue.shift()!;
    job.status = 'processing';
    job.updatedAt = new Date();
    
    this.processingJobs.set(job.id, job);
    this.queues.set(queueName, queue);

    this.logger.log(`Trabajo obtenido de la cola: ${job.id} (${job.type})`);
    
    return job;
  }

  /**
   * Marca un trabajo como completado
   */
  async completeJob(jobId: string, result?: any): Promise<void> {
    const job = this.processingJobs.get(jobId);
    if (!job) {
      this.logger.warn(`Trabajo no encontrado para completar: ${jobId}`);
      return;
    }

    job.status = 'completed';
    job.result = result;
    job.completedAt = new Date();
    job.updatedAt = new Date();

    this.processingJobs.delete(jobId);
    this.addToCompletedJobs(job);

    this.logger.log(`Trabajo completado: ${jobId}`);
  }

  /**
   * Marca un trabajo como fallido
   */
  async failJob(jobId: string, error: string, retryable: boolean = true): Promise<void> {
    const job = this.processingJobs.get(jobId);
    if (!job) {
      this.logger.warn(`Trabajo no encontrado para marcar como fallido: ${jobId}`);
      return;
    }

    job.status = retryable ? 'failed' : 'cancelled';
    job.error = error;
    job.failedAt = new Date();
    job.updatedAt = new Date();

    this.processingJobs.delete(jobId);

    if (retryable) {
      this.addToFailedJobs(job);
    } else {
      this.addToCompletedJobs(job);
    }

    this.logger.log(`Trabajo marcado como fallido: ${jobId} (retryable: ${retryable})`);
  }

  /**
   * Reintenta un trabajo fallido
   */
  async retryJob(jobId: string): Promise<Job | null> {
    const failedJobs = this.getAllFailedJobs();
    const job = failedJobs.find(j => j.id === jobId);
    
    if (!job) {
      this.logger.warn(`Trabajo fallido no encontrado para reintentar: ${jobId}`);
      return null;
    }

    // Crear nuevo trabajo basado en el fallido
    const retryJob: Job = {
      ...job,
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      retryCount: (job.retryCount || 0) + 1,
      error: undefined,
      failedAt: undefined,
      completedAt: undefined,
      result: undefined,
    };

    const queueName = this.getQueueName(job.type);
    const queue = this.queues.get(queueName) || [];
    
    // Insertar con prioridad alta para reintentos
    this.insertJobByPriority(queue, { ...retryJob, priority: 'high' });
    this.queues.set(queueName, queue);

    // Remover de trabajos fallidos
    this.removeFromFailedJobs(job);

    this.logger.log(`Trabajo programado para reintento: ${retryJob.id} (intento ${retryJob.retryCount})`);
    
    return retryJob;
  }

  /**
   * Obtiene el estado de las colas
   */
  getQueueStatus(): Record<string, {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  }> {
    const status: Record<string, any> = {};

    // Estado por cola
    for (const [queueName, queue] of this.queues.entries()) {
      status[queueName] = {
        pending: queue.length,
        processing: 0,
        completed: 0,
        failed: 0,
      };
    }

    // Trabajos en procesamiento
    for (const job of this.processingJobs.values()) {
      const queueName = this.getQueueName(job.type);
      if (status[queueName]) {
        status[queueName].processing++;
      }
    }

    // Trabajos completados y fallidos
    for (const jobs of this.completedJobs.values()) {
      jobs.forEach(job => {
        const queueName = this.getQueueName(job.type);
        if (status[queueName]) {
          status[queueName].completed++;
        }
      });
    }

    for (const jobs of this.failedJobs.values()) {
      jobs.forEach(job => {
        const queueName = this.getQueueName(job.type);
        if (status[queueName]) {
          status[queueName].failed++;
        }
      });
    }

    return status;
  }

  /**
   * Obtiene trabajos pendientes de una cola
   */
  getPendingJobs(queueName: string, limit: number = 50): Job[] {
    const queue = this.queues.get(queueName) || [];
    return queue.slice(0, limit);
  }

  /**
   * Obtiene trabajos fallidos
   */
  getFailedJobs(tenantId?: string, limit: number = 50): Job[] {
    const failedJobs = tenantId 
      ? this.failedJobs.get(tenantId) || []
      : this.getAllFailedJobs();
    
    return failedJobs.slice(0, limit);
  }

  /**
   * Obtiene trabajos completados
   */
  getCompletedJobs(tenantId?: string, limit: number = 50): Job[] {
    const completedJobs = tenantId 
      ? this.completedJobs.get(tenantId) || []
      : this.getAllCompletedJobs();
    
    return completedJobs.slice(0, limit);
  }

  /**
   * Limpia trabajos antiguos
   */
  async cleanupOldJobs(tenantId: string, daysToKeep: number = 7): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    let removedCount = 0;

    // Limpiar trabajos completados
    const completedJobs = this.completedJobs.get(tenantId) || [];
    const filteredCompleted = completedJobs.filter(job => {
      if (job.completedAt && job.completedAt < cutoffDate) {
        removedCount++;
        return false;
      }
      return true;
    });
    this.completedJobs.set(tenantId, filteredCompleted);

    // Limpiar trabajos fallidos
    const failedJobs = this.failedJobs.get(tenantId) || [];
    const filteredFailed = failedJobs.filter(job => {
      if (job.failedAt && job.failedAt < cutoffDate) {
        removedCount++;
        return false;
      }
      return true;
    });
    this.failedJobs.set(tenantId, filteredFailed);

    this.logger.log(`Limpieza completada para tenant ${tenantId}: ${removedCount} trabajos eliminados`);
    
    return removedCount;
  }

  /**
   * Obtiene estadísticas de trabajos
   */
  getJobStats(tenantId?: string): {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    byType: Record<string, number>;
    averageProcessingTime: number;
  } {
    const stats = {
      total: 0,
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      byType: {} as Record<string, number>,
      averageProcessingTime: 0,
    };

    // Contar trabajos pendientes
    for (const queue of this.queues.values()) {
      stats.pending += queue.length;
      queue.forEach(job => {
        stats.byType[job.type] = (stats.byType[job.type] || 0) + 1;
      });
    }

    // Contar trabajos en procesamiento
    for (const job of this.processingJobs.values()) {
      if (!tenantId || job.tenantId === tenantId) {
        stats.processing++;
        stats.byType[job.type] = (stats.byType[job.type] || 0) + 1;
      }
    }

    // Contar trabajos completados
    const completedJobs = tenantId 
      ? this.completedJobs.get(tenantId) || []
      : this.getAllCompletedJobs();
    
    stats.completed = completedJobs.length;
    completedJobs.forEach(job => {
      stats.byType[job.type] = (stats.byType[job.type] || 0) + 1;
    });

    // Contar trabajos fallidos
    const failedJobs = tenantId 
      ? this.failedJobs.get(tenantId) || []
      : this.getAllFailedJobs();
    
    stats.failed = failedJobs.length;
    failedJobs.forEach(job => {
      stats.byType[job.type] = (stats.byType[job.type] || 0) + 1;
    });

    stats.total = stats.pending + stats.processing + stats.completed + stats.failed;

    // Calcular tiempo promedio de procesamiento
    const allCompletedJobs = tenantId 
      ? this.completedJobs.get(tenantId) || []
      : this.getAllCompletedJobs();
    
    if (allCompletedJobs.length > 0) {
      const totalTime = allCompletedJobs.reduce((sum, job) => {
        if (job.completedAt && job.createdAt) {
          return sum + (job.completedAt.getTime() - job.createdAt.getTime());
        }
        return sum;
      }, 0);
      
      stats.averageProcessingTime = totalTime / allCompletedJobs.length;
    }

    return stats;
  }

  /**
   * Obtiene el nombre de la cola para un tipo de trabajo
   */
  private getQueueName(jobType: JobType): string {
    switch (jobType) {
      case 'webhook-retry':
        return 'webhook-retry';
      case 'payment-sync':
        return 'payment-sync';
      case 'delivery-sync':
        return 'delivery-sync';
      case 'message-retry':
        return 'message-retry';
      case 'cleanup':
        return 'cleanup';
      case 'report':
        return 'report';
      case 'notification':
        return 'notification';
      default:
        return 'default';
    }
  }

  /**
   * Inserta un trabajo en la cola según su prioridad
   */
  private insertJobByPriority(queue: Job[], job: Job): void {
    const priorityOrder = { high: 0, normal: 1, low: 2 };
    const jobPriority = priorityOrder[job.priority];
    
    let insertIndex = queue.length;
    for (let i = 0; i < queue.length; i++) {
      const queuePriority = priorityOrder[queue[i].priority];
      if (jobPriority < queuePriority) {
        insertIndex = i;
        break;
      }
    }
    
    queue.splice(insertIndex, 0, job);
  }

  /**
   * Agrega un trabajo a los completados
   */
  private addToCompletedJobs(job: Job): void {
    const tenantId = job.tenantId || 'global';
    const completedJobs = this.completedJobs.get(tenantId) || [];
    completedJobs.push(job);
    
    // Mantener solo los últimos 1000 trabajos completados
    if (completedJobs.length > 1000) {
      completedJobs.splice(0, completedJobs.length - 1000);
    }
    
    this.completedJobs.set(tenantId, completedJobs);
  }

  /**
   * Agrega un trabajo a los fallidos
   */
  private addToFailedJobs(job: Job): void {
    const tenantId = job.tenantId || 'global';
    const failedJobs = this.failedJobs.get(tenantId) || [];
    failedJobs.push(job);
    
    // Mantener solo los últimos 500 trabajos fallidos
    if (failedJobs.length > 500) {
      failedJobs.splice(0, failedJobs.length - 500);
    }
    
    this.failedJobs.set(tenantId, failedJobs);
  }

  /**
   * Remueve un trabajo de los fallidos
   */
  private removeFromFailedJobs(job: Job): void {
    const tenantId = job.tenantId || 'global';
    const failedJobs = this.failedJobs.get(tenantId) || [];
    const filteredJobs = failedJobs.filter(j => j.id !== job.id);
    this.failedJobs.set(tenantId, filteredJobs);
  }

  /**
   * Obtiene todos los trabajos fallidos
   */
  private getAllFailedJobs(): Job[] {
    const allFailedJobs: Job[] = [];
    for (const jobs of this.failedJobs.values()) {
      allFailedJobs.push(...jobs);
    }
    return allFailedJobs;
  }

  /**
   * Obtiene todos los trabajos completados
   */
  private getAllCompletedJobs(): Job[] {
    const allCompletedJobs: Job[] = [];
    for (const jobs of this.completedJobs.values()) {
      allCompletedJobs.push(...jobs);
    }
    return allCompletedJobs;
  }
}
