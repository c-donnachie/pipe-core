import { Injectable, Logger } from '@nestjs/common';
import { Job, JobType } from './interfaces';

@Injectable()
export class JobProcessor {
  private readonly logger = new Logger(JobProcessor.name);
  private processors: Map<JobType, (job: Job) => Promise<any>> = new Map();

  constructor() {
    this.initializeProcessors();
  }

  /**
   * Inicializa los procesadores de trabajos
   */
  private initializeProcessors(): void {
    // Procesador para reintentos de webhooks
    this.processors.set('webhook-retry', async (job: Job) => {
      this.logger.log(`Procesando reintento de webhook: ${job.id}`);
      
      // Simular procesamiento de reintento de webhook
      await this.simulateProcessing(job, 1000);
      
      return { 
        success: true, 
        message: 'Webhook reintentado exitosamente',
        webhookUrl: job.data?.webhookUrl,
        eventId: job.data?.eventId
      };
    });

    // Procesador para sincronización de pagos
    this.processors.set('payment-sync', async (job: Job) => {
      this.logger.log(`Procesando sincronización de pago: ${job.id}`);
      
      // Simular sincronización de pago con proveedor externo
      await this.simulateProcessing(job, 2000);
      
      return { 
        success: true, 
        message: 'Pago sincronizado exitosamente',
        paymentId: job.data?.paymentId,
        provider: job.data?.provider
      };
    });

    // Procesador para sincronización de delivery
    this.processors.set('delivery-sync', async (job: Job) => {
      this.logger.log(`Procesando sincronización de delivery: ${job.id}`);
      
      // Simular sincronización de delivery con proveedor externo
      await this.simulateProcessing(job, 3000);
      
      return { 
        success: true, 
        message: 'Delivery sincronizado exitosamente',
        deliveryId: job.data?.deliveryId,
        provider: job.data?.provider
      };
    });

    // Procesador para reintentos de mensajes
    this.processors.set('message-retry', async (job: Job) => {
      this.logger.log(`Procesando reintento de mensaje: ${job.id}`);
      
      // Simular reintento de mensaje
      await this.simulateProcessing(job, 1500);
      
      return { 
        success: true, 
        message: 'Mensaje reintentado exitosamente',
        messageId: job.data?.messageId,
        channel: job.data?.channel
      };
    });

    // Procesador para limpieza de datos
    this.processors.set('cleanup', async (job: Job) => {
      this.logger.log(`Procesando limpieza de datos: ${job.id}`);
      
      // Simular limpieza de datos antiguos
      await this.simulateProcessing(job, 5000);
      
      return { 
        success: true, 
        message: 'Limpieza completada exitosamente',
        recordsDeleted: Math.floor(Math.random() * 1000),
        tenantId: job.tenantId
      };
    });

    // Procesador para generación de reportes
    this.processors.set('report', async (job: Job) => {
      this.logger.log(`Procesando generación de reporte: ${job.id}`);
      
      // Simular generación de reporte
      await this.simulateProcessing(job, 10000);
      
      return { 
        success: true, 
        message: 'Reporte generado exitosamente',
        reportType: job.data?.reportType,
        reportId: `report_${Date.now()}`,
        tenantId: job.tenantId
      };
    });

    // Procesador para notificaciones
    this.processors.set('notification', async (job: Job) => {
      this.logger.log(`Procesando notificación: ${job.id}`);
      
      // Simular envío de notificación
      await this.simulateProcessing(job, 800);
      
      return { 
        success: true, 
        message: 'Notificación enviada exitosamente',
        notificationType: job.data?.type,
        recipient: job.data?.recipient
      };
    });

    this.logger.log(`${this.processors.size} procesadores de trabajos inicializados`);
  }

  /**
   * Procesa un trabajo
   */
  async processJob(job: Job): Promise<any> {
    const processor = this.processors.get(job.type);
    
    if (!processor) {
      throw new Error(`No hay procesador disponible para el tipo de trabajo: ${job.type}`);
    }

    this.logger.log(`Iniciando procesamiento de trabajo: ${job.id} (${job.type})`);
    
    try {
      const startTime = Date.now();
      const result = await processor(job);
      const processingTime = Date.now() - startTime;
      
      this.logger.log(`Trabajo procesado exitosamente: ${job.id} (${processingTime}ms)`);
      
      return {
        ...result,
        processingTime,
        processedAt: new Date(),
      };
      
    } catch (error) {
      this.logger.error(`Error procesando trabajo ${job.id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Simula procesamiento de trabajo
   */
  private async simulateProcessing(job: Job, baseTime: number): Promise<void> {
    // Simular tiempo de procesamiento variable
    const processingTime = baseTime + (Math.random() * 1000);
    
    // Simular fallo ocasional (5% de probabilidad)
    if (Math.random() < 0.05) {
      throw new Error(`Error simulado en procesamiento de ${job.type}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, processingTime));
  }

  /**
   * Valida un trabajo antes de procesarlo
   */
  validateJob(job: Job): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!job.id) {
      errors.push('ID del trabajo es requerido');
    }

    if (!job.type) {
      errors.push('Tipo de trabajo es requerido');
    }

    if (!job.tenantId) {
      errors.push('ID del tenant es requerido');
    }

    if (!job.data) {
      errors.push('Datos del trabajo son requeridos');
    }

    // Validaciones específicas por tipo
    switch (job.type) {
      case 'webhook-retry':
        if (!job.data.webhookUrl) {
          errors.push('URL del webhook es requerida para reintentos de webhook');
        }
        if (!job.data.eventId) {
          errors.push('ID del evento es requerido para reintentos de webhook');
        }
        break;

      case 'payment-sync':
        if (!job.data.paymentId) {
          errors.push('ID del pago es requerido para sincronización de pagos');
        }
        if (!job.data.provider) {
          errors.push('Proveedor es requerido para sincronización de pagos');
        }
        break;

      case 'delivery-sync':
        if (!job.data.deliveryId) {
          errors.push('ID del delivery es requerido para sincronización de delivery');
        }
        if (!job.data.provider) {
          errors.push('Proveedor es requerido para sincronización de delivery');
        }
        break;

      case 'message-retry':
        if (!job.data.messageId) {
          errors.push('ID del mensaje es requerido para reintentos de mensajes');
        }
        if (!job.data.channel) {
          errors.push('Canal es requerido para reintentos de mensajes');
        }
        break;

      case 'cleanup':
        if (!job.data.dataType) {
          errors.push('Tipo de datos es requerido para limpieza');
        }
        if (!job.data.olderThan) {
          errors.push('Fecha límite es requerida para limpieza');
        }
        break;

      case 'report':
        if (!job.data.reportType) {
          errors.push('Tipo de reporte es requerido');
        }
        break;

      case 'notification':
        if (!job.data.type) {
          errors.push('Tipo de notificación es requerido');
        }
        if (!job.data.recipient) {
          errors.push('Destinatario es requerido para notificaciones');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Obtiene información sobre los procesadores disponibles
   */
  getAvailableProcessors(): Array<{
    type: JobType;
    description: string;
    estimatedTime: string;
  }> {
    return [
      {
        type: 'webhook-retry',
        description: 'Reintenta webhooks fallidos',
        estimatedTime: '1-2 segundos',
      },
      {
        type: 'payment-sync',
        description: 'Sincroniza pagos con proveedores externos',
        estimatedTime: '2-3 segundos',
      },
      {
        type: 'delivery-sync',
        description: 'Sincroniza deliveries con proveedores externos',
        estimatedTime: '3-4 segundos',
      },
      {
        type: 'message-retry',
        description: 'Reintenta mensajes fallidos',
        estimatedTime: '1-2 segundos',
      },
      {
        type: 'cleanup',
        description: 'Limpia datos antiguos',
        estimatedTime: '5-6 segundos',
      },
      {
        type: 'report',
        description: 'Genera reportes',
        estimatedTime: '10-15 segundos',
      },
      {
        type: 'notification',
        description: 'Envía notificaciones',
        estimatedTime: '0.5-1 segundo',
      },
    ];
  }

  /**
   * Obtiene estadísticas de procesamiento
   */
  getProcessingStats(): {
    totalProcessors: number;
    availableTypes: JobType[];
    lastProcessed: Date | null;
  } {
    return {
      totalProcessors: this.processors.size,
      availableTypes: Array.from(this.processors.keys()),
      lastProcessed: new Date(), // En una implementación real, esto vendría de logs
    };
  }

  /**
   * Registra un procesador personalizado
   */
  registerProcessor(jobType: JobType, processor: (job: Job) => Promise<any>): void {
    this.processors.set(jobType, processor);
    this.logger.log(`Procesador personalizado registrado para tipo: ${jobType}`);
  }

  /**
   * Remueve un procesador
   */
  unregisterProcessor(jobType: JobType): void {
    this.processors.delete(jobType);
    this.logger.log(`Procesador removido para tipo: ${jobType}`);
  }

  /**
   * Health check del procesador
   */
  healthCheck(): { status: string; processors: number; timestamp: string } {
    return {
      status: 'healthy',
      processors: this.processors.size,
      timestamp: new Date().toISOString(),
    };
  }
}
