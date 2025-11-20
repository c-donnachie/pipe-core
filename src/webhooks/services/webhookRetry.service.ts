import { Injectable, Logger } from '@nestjs/common';
import { WebhookEvent, RetryQueueItem } from '../interfaces';

@Injectable()
export class WebhookRetryService {
  private readonly logger = new Logger(WebhookRetryService.name);
  private retryQueue: Map<string, RetryQueueItem[]> = new Map();
  private retryIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    // Iniciar procesador de cola de reintentos
    this.startRetryProcessor();
  }

  /**
   * Programa un reintento para un evento fallido
   */
  async scheduleRetry(event: WebhookEvent, errorMessage: string, maxRetries: number = 3): Promise<void> {
    const tenantId = event.tenantId;
    const retryQueue = this.retryQueue.get(tenantId) || [];

    // Verificar si ya existe un item en la cola para este evento
    const existingIndex = retryQueue.findIndex(item => item.eventId === event.eventId);
    
    const retryCount = existingIndex >= 0 ? retryQueue[existingIndex].retryCount + 1 : 0;

    if (retryCount >= maxRetries) {
      this.logger.warn(`Máximo número de reintentos alcanzado para evento: ${event.eventId}`);
      return;
    }

    // Calcular tiempo de reintento con backoff exponencial
    const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 300000); // Máximo 5 minutos
    const nextRetryAt = new Date(Date.now() + retryDelay);

    const retryItem: RetryQueueItem = {
      id: `retry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      eventId: event.eventId,
      tenantId: event.tenantId,
      eventType: event.eventType,
      webhookUrl: 'internal', // Se determinará en el momento del reintento
      payload: event.data,
      retryCount,
      maxRetries,
      nextRetryAt,
      lastError: errorMessage,
      createdAt: new Date(),
    };

    if (existingIndex >= 0) {
      retryQueue[existingIndex] = retryItem;
    } else {
      retryQueue.push(retryItem);
    }

    this.retryQueue.set(tenantId, retryQueue);

    this.logger.log(`Reintento programado para evento ${event.eventId}: intento ${retryCount + 1}/${maxRetries} en ${retryDelay}ms`);
  }

  /**
   * Obtiene la cola de reintentos para un tenant
   */
  async getRetryQueue(tenantId: string, limit: number = 50): Promise<RetryQueueItem[]> {
    const retryQueue = this.retryQueue.get(tenantId) || [];
    
    // Ordenar por próxima fecha de reintento
    retryQueue.sort((a, b) => a.nextRetryAt.getTime() - b.nextRetryAt.getTime());
    
    return retryQueue.slice(0, limit);
  }

  /**
   * Reprocesa eventos fallidos manualmente
   */
  async reprocessFailedEvents(tenantId: string, eventType?: string): Promise<number> {
    const retryQueue = this.retryQueue.get(tenantId) || [];
    let processedCount = 0;

    const itemsToProcess = eventType 
      ? retryQueue.filter(item => item.eventType === eventType)
      : retryQueue;

    for (const item of itemsToProcess) {
      try {
        // Aquí se integraría con el WebhookRouter para reprocesar el evento
        // Por ahora, simulamos el procesamiento
        await this.processRetryItem(item);
        
        // Remover de la cola si fue exitoso
        this.removeFromRetryQueue(tenantId, item.id);
        processedCount++;
        
        this.logger.log(`Evento reprocesado exitosamente: ${item.eventId}`);
        
      } catch (error) {
        this.logger.error(`Error reprocesando evento ${item.eventId}: ${error.message}`);
        
        // Incrementar contador de reintentos
        item.retryCount++;
        item.lastError = error.message;
        
        if (item.retryCount >= item.maxRetries) {
          // Remover de la cola si alcanzó el máximo de reintentos
          this.removeFromRetryQueue(tenantId, item.id);
          this.logger.warn(`Evento removido de la cola después de ${item.maxRetries} reintentos: ${item.eventId}`);
        } else {
          // Programar siguiente reintento
          const retryDelay = Math.min(1000 * Math.pow(2, item.retryCount), 300000);
          item.nextRetryAt = new Date(Date.now() + retryDelay);
        }
      }
    }

    this.logger.log(`Reprocesamiento manual completado: ${processedCount} eventos procesados para tenant ${tenantId}`);
    return processedCount;
  }

  /**
   * Limpia la cola de reintentos
   */
  async cleanupRetryQueue(tenantId: string, olderThanHours: number = 24): Promise<number> {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - olderThanHours);

    const retryQueue = this.retryQueue.get(tenantId) || [];
    const originalLength = retryQueue.length;

    // Filtrar items antiguos
    const filteredQueue = retryQueue.filter(item => item.createdAt >= cutoffTime);
    
    this.retryQueue.set(tenantId, filteredQueue);
    
    const removedCount = originalLength - filteredQueue.length;
    
    if (removedCount > 0) {
      this.logger.log(`Limpieza de cola de reintentos completada para tenant ${tenantId}: ${removedCount} items eliminados`);
    }
    
    return removedCount;
  }

  /**
   * Obtiene estadísticas de la cola de reintentos
   */
  getRetryQueueStats(tenantId: string): {
    totalItems: number;
    itemsByEventType: Record<string, number>;
    itemsByRetryCount: Record<number, number>;
    nextRetryIn: number | null;
  } {
    const retryQueue = this.retryQueue.get(tenantId) || [];
    
    const stats = {
      totalItems: retryQueue.length,
      itemsByEventType: {} as Record<string, number>,
      itemsByRetryCount: {} as Record<number, number>,
      nextRetryIn: null as number | null,
    };

    // Calcular estadísticas
    retryQueue.forEach(item => {
      // Por tipo de evento
      stats.itemsByEventType[item.eventType] = (stats.itemsByEventType[item.eventType] || 0) + 1;
      
      // Por número de reintentos
      stats.itemsByRetryCount[item.retryCount] = (stats.itemsByRetryCount[item.retryCount] || 0) + 1;
    });

    // Calcular próximo reintento
    if (retryQueue.length > 0) {
      const nextRetry = retryQueue.reduce((earliest, item) => 
        item.nextRetryAt < earliest.nextRetryAt ? item : earliest
      );
      
      const now = new Date();
      if (nextRetry.nextRetryAt > now) {
        stats.nextRetryIn = nextRetry.nextRetryAt.getTime() - now.getTime();
      }
    }

    return stats;
  }

  /**
   * Inicia el procesador automático de reintentos
   */
  private startRetryProcessor(): void {
    // Procesar cola cada 30 segundos
    setInterval(() => {
      this.processRetryQueue();
    }, 30000);

    this.logger.log('Procesador automático de reintentos iniciado');
  }

  /**
   * Procesa la cola de reintentos automáticamente
   */
  private async processRetryQueue(): Promise<void> {
    const now = new Date();
    
    for (const [tenantId, retryQueue] of this.retryQueue.entries()) {
      const itemsToProcess = retryQueue.filter(item => item.nextRetryAt <= now);
      
      for (const item of itemsToProcess) {
        try {
          await this.processRetryItem(item);
          
          // Remover de la cola si fue exitoso
          this.removeFromRetryQueue(tenantId, item.id);
          
          this.logger.log(`Evento reprocesado automáticamente: ${item.eventId}`);
          
        } catch (error) {
          this.logger.error(`Error en reintento automático para evento ${item.eventId}: ${error.message}`);
          
          // Incrementar contador de reintentos
          item.retryCount++;
          item.lastError = error.message;
          
          if (item.retryCount >= item.maxRetries) {
            // Remover de la cola si alcanzó el máximo de reintentos
            this.removeFromRetryQueue(tenantId, item.id);
            this.logger.warn(`Evento removido de la cola después de ${item.maxRetries} reintentos: ${item.eventId}`);
          } else {
            // Programar siguiente reintento
            const retryDelay = Math.min(1000 * Math.pow(2, item.retryCount), 300000);
            item.nextRetryAt = new Date(Date.now() + retryDelay);
          }
        }
      }
    }
  }

  /**
   * Procesa un item individual de reintento
   */
  private async processRetryItem(item: RetryQueueItem): Promise<void> {
    // Simular procesamiento del evento
    // En una implementación real, aquí se recrearía el evento y se procesaría
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Simular éxito o fallo aleatorio (90% éxito)
    if (Math.random() < 0.9) {
      return; // Éxito
    } else {
      throw new Error('Error simulado en reintento');
    }
  }

  /**
   * Remueve un item de la cola de reintentos
   */
  private removeFromRetryQueue(tenantId: string, itemId: string): void {
    const retryQueue = this.retryQueue.get(tenantId) || [];
    const filteredQueue = retryQueue.filter(item => item.id !== itemId);
    this.retryQueue.set(tenantId, filteredQueue);
  }

  /**
   * Pausa los reintentos para un tenant
   */
  pauseRetries(tenantId: string): void {
    const intervalId = this.retryIntervals.get(tenantId);
    if (intervalId) {
      clearInterval(intervalId);
      this.retryIntervals.delete(tenantId);
      this.logger.log(`Reintentos pausados para tenant: ${tenantId}`);
    }
  }

  /**
   * Reanuda los reintentos para un tenant
   */
  resumeRetries(tenantId: string): void {
    if (!this.retryIntervals.has(tenantId)) {
      const intervalId = setInterval(() => {
        this.processRetryQueueForTenant(tenantId);
      }, 30000);
      
      this.retryIntervals.set(tenantId, intervalId);
      this.logger.log(`Reintentos reanudados para tenant: ${tenantId}`);
    }
  }

  /**
   * Procesa la cola de reintentos para un tenant específico
   */
  private async processRetryQueueForTenant(tenantId: string): Promise<void> {
    const retryQueue = this.retryQueue.get(tenantId) || [];
    const now = new Date();
    const itemsToProcess = retryQueue.filter(item => item.nextRetryAt <= now);
    
    for (const item of itemsToProcess) {
      try {
        await this.processRetryItem(item);
        this.removeFromRetryQueue(tenantId, item.id);
        this.logger.log(`Evento reprocesado para tenant ${tenantId}: ${item.eventId}`);
      } catch (error) {
        this.logger.error(`Error en reintento para tenant ${tenantId}, evento ${item.eventId}: ${error.message}`);
        
        item.retryCount++;
        item.lastError = error.message;
        
        if (item.retryCount >= item.maxRetries) {
          this.removeFromRetryQueue(tenantId, item.id);
        } else {
          const retryDelay = Math.min(1000 * Math.pow(2, item.retryCount), 300000);
          item.nextRetryAt = new Date(Date.now() + retryDelay);
        }
      }
    }
  }

  /**
   * Obtiene el estado de la cola de reintentos
   */
  getRetryQueueStatus(): {
    totalTenants: number;
    totalItems: number;
    activeIntervals: number;
    byTenant: Record<string, number>;
  } {
    const status = {
      totalTenants: this.retryQueue.size,
      totalItems: 0,
      activeIntervals: this.retryIntervals.size,
      byTenant: {} as Record<string, number>,
    };

    for (const [tenantId, retryQueue] of this.retryQueue.entries()) {
      status.totalItems += retryQueue.length;
      status.byTenant[tenantId] = retryQueue.length;
    }

    return status;
  }

  /**
   * Limpia todos los reintentos para un tenant
   */
  clearRetryQueue(tenantId: string): number {
    const retryQueue = this.retryQueue.get(tenantId) || [];
    const itemCount = retryQueue.length;
    
    this.retryQueue.set(tenantId, []);
    this.pauseRetries(tenantId);
    
    this.logger.log(`Cola de reintentos limpiada para tenant ${tenantId}: ${itemCount} items eliminados`);
    
    return itemCount;
  }
}
