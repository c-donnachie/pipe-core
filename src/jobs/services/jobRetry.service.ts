import { Injectable, Logger } from '@nestjs/common';
import { Job, JobRetryConfig } from '../interfaces';

@Injectable()
export class JobRetryService {
  private readonly logger = new Logger(JobRetryService.name);
  private retryConfigs: Map<string, JobRetryConfig> = new Map();
  private retryQueue: Map<string, Job[]> = new Map();

  constructor() {
    this.initializeDefaultConfigs();
  }

  /**
   * Inicializa configuraciones por defecto
   */
  private initializeDefaultConfigs(): void {
    // Configuración por defecto para diferentes tipos de trabajos
    const defaultConfig: JobRetryConfig = {
      maxRetries: 3,
      retryDelay: 1000, // 1 segundo
      backoffMultiplier: 2,
      maxRetryDelay: 300000, // 5 minutos
    };

    this.retryConfigs.set('webhook-retry', { ...defaultConfig, maxRetries: 5 });
    this.retryConfigs.set('payment-sync', { ...defaultConfig, maxRetries: 3 });
    this.retryConfigs.set('delivery-sync', { ...defaultConfig, maxRetries: 3 });
    this.retryConfigs.set('message-retry', { ...defaultConfig, maxRetries: 4 });
    this.retryConfigs.set('cleanup', { ...defaultConfig, maxRetries: 2 });
    this.retryConfigs.set('report', { ...defaultConfig, maxRetries: 2 });
    this.retryConfigs.set('notification', { ...defaultConfig, maxRetries: 5 });

    this.logger.log(`Configuraciones de reintento inicializadas para ${this.retryConfigs.size} tipos de trabajos`);
  }

  /**
   * Programa un reintento para un trabajo fallido
   */
  async scheduleRetry(job: Job, errorMessage: string): Promise<void> {
    const config = this.getRetryConfig(job.type);
    
    if (!config) {
      this.logger.warn(`No hay configuración de reintento para tipo de trabajo: ${job.type}`);
      return;
    }

    const currentRetryCount = job.retryCount || 0;
    
    if (currentRetryCount >= config.maxRetries) {
      this.logger.warn(`Máximo número de reintentos alcanzado para trabajo: ${job.id}`);
      return;
    }

    // Calcular tiempo de reintento con backoff exponencial
    const retryDelay = Math.min(
      config.retryDelay * Math.pow(config.backoffMultiplier, currentRetryCount),
      config.maxRetryDelay
    );

    const retryJob: Job = {
      ...job,
      id: `retry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      retryCount: currentRetryCount + 1,
      maxRetries: config.maxRetries,
      error: errorMessage,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Programar reintento
    setTimeout(async () => {
      await this.executeRetry(retryJob);
    }, retryDelay);

    // Agregar a cola de reintentos
    const tenantId = job.tenantId || 'global';
    const tenantRetryQueue = this.retryQueue.get(tenantId) || [];
    tenantRetryQueue.push(retryJob);
    this.retryQueue.set(tenantId, tenantRetryQueue);

    this.logger.log(`Reintento programado para trabajo ${job.id}: intento ${retryJob.retryCount}/${config.maxRetries} en ${retryDelay}ms`);
  }

  /**
   * Ejecuta un reintento
   */
  private async executeRetry(retryJob: Job): Promise<void> {
    try {
      this.logger.log(`Ejecutando reintento para trabajo: ${retryJob.id} (intento ${retryJob.retryCount})`);
      
      // Aquí se integraría con el JobProcessor para ejecutar el trabajo
      // Por ahora, simulamos el procesamiento
      await this.simulateJobExecution(retryJob);
      
      // Remover de la cola de reintentos si fue exitoso
      this.removeFromRetryQueue(retryJob);
      
      this.logger.log(`Reintento exitoso para trabajo: ${retryJob.id}`);
      
    } catch (error) {
      this.logger.error(`Error en reintento para trabajo ${retryJob.id}: ${error.message}`);
      
      // Programar siguiente reintento si no se alcanzó el máximo
      const config = this.getRetryConfig(retryJob.type);
      if (config && retryJob.retryCount < config.maxRetries) {
        await this.scheduleRetry(retryJob, error.message);
      } else {
        this.logger.warn(`Trabajo ${retryJob.id} alcanzó máximo de reintentos`);
        this.removeFromRetryQueue(retryJob);
      }
    }
  }

  /**
   * Reprocesa trabajos fallidos manualmente
   */
  async reprocessFailedJobs(tenantId: string, jobType?: string): Promise<number> {
    this.logger.log(`Reprocesando trabajos fallidos para tenant: ${tenantId}`);
    
    const retryQueue = this.retryQueue.get(tenantId) || [];
    let processedCount = 0;

    const jobsToProcess = jobType 
      ? retryQueue.filter(job => job.type === jobType)
      : retryQueue;

    for (const job of jobsToProcess) {
      try {
        await this.executeRetry(job);
        processedCount++;
        this.logger.log(`Trabajo reprocesado exitosamente: ${job.id}`);
      } catch (error) {
        this.logger.error(`Error reprocesando trabajo ${job.id}: ${error.message}`);
      }
    }

    this.logger.log(`Reprocesamiento manual completado: ${processedCount} trabajos procesados para tenant ${tenantId}`);
    
    return processedCount;
  }

  /**
   * Obtiene trabajos en cola de reintento
   */
  getRetryQueue(tenantId?: string): Job[] {
    if (tenantId) {
      return this.retryQueue.get(tenantId) || [];
    }

    // Obtener todos los trabajos de reintento
    const allRetryJobs: Job[] = [];
    for (const jobs of this.retryQueue.values()) {
      allRetryJobs.push(...jobs);
    }
    
    return allRetryJobs;
  }

  /**
   * Obtiene estadísticas de reintentos
   */
  getRetryStats(tenantId?: string): {
    totalRetries: number;
    successfulRetries: number;
    failedRetries: number;
    averageRetryCount: number;
    byType: Record<string, number>;
    queueSize: number;
  } {
    const retryJobs = this.getRetryQueue(tenantId);
    
    const stats = {
      totalRetries: retryJobs.reduce((sum, job) => sum + (job.retryCount || 0), 0),
      successfulRetries: 0, // Se calcularía basado en trabajos completados
      failedRetries: 0, // Se calcularía basado en trabajos fallidos definitivamente
      averageRetryCount: 0,
      byType: {} as Record<string, number>,
      queueSize: retryJobs.length,
    };

    if (retryJobs.length > 0) {
      stats.averageRetryCount = stats.totalRetries / retryJobs.length;
    }

    // Contar por tipo
    retryJobs.forEach(job => {
      stats.byType[job.type] = (stats.byType[job.type] || 0) + 1;
    });

    return stats;
  }

  /**
   * Actualiza configuración de reintentos para un tipo de trabajo
   */
  updateRetryConfig(jobType: string, config: Partial<JobRetryConfig>): void {
    const currentConfig = this.retryConfigs.get(jobType) || {
      maxRetries: 3,
      retryDelay: 1000,
      backoffMultiplier: 2,
      maxRetryDelay: 300000,
    };

    const updatedConfig: JobRetryConfig = {
      ...currentConfig,
      ...config,
    };

    this.retryConfigs.set(jobType, updatedConfig);
    this.logger.log(`Configuración de reintento actualizada para tipo: ${jobType}`);
  }

  /**
   * Obtiene configuración de reintentos
   */
  getRetryConfig(jobType: string): JobRetryConfig | null {
    return this.retryConfigs.get(jobType) || null;
  }

  /**
   * Obtiene todas las configuraciones de reintentos
   */
  getAllRetryConfigs(): Record<string, JobRetryConfig> {
    const configs: Record<string, JobRetryConfig> = {};
    
    for (const [jobType, config] of this.retryConfigs.entries()) {
      configs[jobType] = config;
    }
    
    return configs;
  }

  /**
   * Limpia cola de reintentos antigua
   */
  async cleanupRetryQueue(tenantId: string, olderThanHours: number = 24): Promise<number> {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - olderThanHours);

    const retryQueue = this.retryQueue.get(tenantId) || [];
    const originalLength = retryQueue.length;

    // Filtrar trabajos antiguos
    const filteredQueue = retryQueue.filter(job => job.createdAt >= cutoffTime);
    
    this.retryQueue.set(tenantId, filteredQueue);
    
    const removedCount = originalLength - filteredQueue.length;
    
    if (removedCount > 0) {
      this.logger.log(`Limpieza de cola de reintentos completada para tenant ${tenantId}: ${removedCount} trabajos eliminados`);
    }
    
    return removedCount;
  }

  /**
   * Pausa reintentos para un tenant
   */
  pauseRetries(tenantId: string): void {
    // En una implementación real, aquí se pausarían los timeouts activos
    this.logger.log(`Reintentos pausados para tenant: ${tenantId}`);
  }

  /**
   * Reanuda reintentos para un tenant
   */
  resumeRetries(tenantId: string): void {
    // En una implementación real, aquí se reanudarían los timeouts pausados
    this.logger.log(`Reintentos reanudados para tenant: ${tenantId}`);
  }

  /**
   * Obtiene el estado de la cola de reintentos
   */
  getRetryQueueStatus(): {
    totalTenants: number;
    totalJobs: number;
    byTenant: Record<string, number>;
    byType: Record<string, number>;
  } {
    const status = {
      totalTenants: this.retryQueue.size,
      totalJobs: 0,
      byTenant: {} as Record<string, number>,
      byType: {} as Record<string, number>,
    };

    for (const [tenantId, jobs] of this.retryQueue.entries()) {
      status.totalJobs += jobs.length;
      status.byTenant[tenantId] = jobs.length;
      
      jobs.forEach(job => {
        status.byType[job.type] = (status.byType[job.type] || 0) + 1;
      });
    }

    return status;
  }

  /**
   * Simula ejecución de trabajo para testing
   */
  private async simulateJobExecution(job: Job): Promise<void> {
    // Simular tiempo de procesamiento
    const processingTime = 1000 + (Math.random() * 2000);
    await new Promise(resolve => setTimeout(resolve, processingTime));
    
    // Simular éxito o fallo (90% éxito)
    if (Math.random() < 0.9) {
      return; // Éxito
    } else {
      throw new Error(`Error simulado en reintento de ${job.type}`);
    }
  }

  /**
   * Remueve un trabajo de la cola de reintentos
   */
  private removeFromRetryQueue(job: Job): void {
    const tenantId = job.tenantId || 'global';
    const retryQueue = this.retryQueue.get(tenantId) || [];
    const filteredQueue = retryQueue.filter(j => j.id !== job.id);
    this.retryQueue.set(tenantId, filteredQueue);
  }

  /**
   * Health check del servicio de reintentos
   */
  healthCheck(): { status: string; retryQueues: number; totalJobs: number; timestamp: string } {
    const status = this.getRetryQueueStatus();
    
    return {
      status: 'healthy',
      retryQueues: status.totalTenants,
      totalJobs: status.totalJobs,
      timestamp: new Date().toISOString(),
    };
  }
}
