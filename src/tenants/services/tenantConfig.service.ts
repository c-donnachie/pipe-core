import { Injectable, Logger } from '@nestjs/common';
import { 
  TenantConfig, 
  TenantSettings, 
  CreateTenantDto, 
  UpdateTenantDto,
  TenantStats 
} from '../interfaces';

@Injectable()
export class TenantConfigService {
  private readonly logger = new Logger(TenantConfigService.name);
  private tenantConfigs: Map<string, TenantConfig> = new Map();

  constructor() {
    this.initializeDefaultConfigs();
  }

  /**
   * Inicializa configuraciones por defecto
   */
  private initializeDefaultConfigs(): void {
    // Configuración por defecto para TableFlow
    this.tenantConfigs.set('tableflow_123', {
      tenantId: 'tableflow_123',
      name: 'TableFlow',
      description: 'Sistema de pedidos para restaurantes',
      status: 'active',
      settings: this.getDefaultSettings(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Configuración por defecto para Genda
    this.tenantConfigs.set('genda_456', {
      tenantId: 'genda_456',
      name: 'Genda',
      description: 'Sistema de citas y agendamiento',
      status: 'active',
      settings: this.getDefaultSettings(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Configuración por defecto para ROE
    this.tenantConfigs.set('roe_789', {
      tenantId: 'roe_789',
      name: 'ROE',
      description: 'E-commerce y marketplace',
      status: 'active',
      settings: this.getDefaultSettings(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    this.logger.log(`Configuraciones por defecto inicializadas para ${this.tenantConfigs.size} tenants`);
  }

  /**
   * Obtiene configuración por defecto
   */
  private getDefaultSettings(): TenantSettings {
    return {
      messaging: {
        defaultProvider: 'resend',
        fallbackProvider: 'sendgrid',
        retryAttempts: 3,
        timeout: 30000,
      },
      payments: {
        defaultProvider: 'mercadopago',
        fallbackProvider: 'transbank',
        currency: 'CLP',
        retryAttempts: 3,
      },
      delivery: {
        defaultProvider: 'uber',
        fallbackProvider: 'rappi',
        retryAttempts: 3,
      },
      notifications: {
        webhookUrl: '',
        emailNotifications: true,
        smsNotifications: true,
      },
      limits: {
        maxMessagesPerDay: 10000,
        maxPaymentsPerDay: 1000,
        maxDeliveryRequestsPerDay: 500,
      },
    };
  }

  /**
   * Crea una nueva configuración de tenant
   */
  async createTenantConfig(createTenantDto: CreateTenantDto): Promise<TenantConfig> {
    const tenantId = this.generateTenantId(createTenantDto.name);
    
    const tenantConfig: TenantConfig = {
      tenantId,
      name: createTenantDto.name,
      description: createTenantDto.description,
      status: 'active',
      settings: {
        ...this.getDefaultSettings(),
        ...createTenantDto.settings,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.tenantConfigs.set(tenantId, tenantConfig);
    this.logger.log(`Configuración creada para tenant: ${tenantId}`);
    
    return tenantConfig;
  }

  /**
   * Obtiene la configuración de un tenant
   */
  async getTenantConfig(tenantId: string): Promise<TenantConfig | null> {
    const config = this.tenantConfigs.get(tenantId);
    if (!config) {
      this.logger.warn(`Configuración no encontrada para tenant: ${tenantId}`);
      return null;
    }
    
    return config;
  }

  /**
   * Actualiza la configuración de un tenant
   */
  async updateTenantConfig(tenantId: string, updateTenantDto: UpdateTenantDto): Promise<TenantConfig> {
    const existingConfig = this.tenantConfigs.get(tenantId);
    if (!existingConfig) {
      throw new Error(`Tenant no encontrado: ${tenantId}`);
    }

    const updatedConfig: TenantConfig = {
      ...existingConfig,
      name: updateTenantDto.name || existingConfig.name,
      description: updateTenantDto.description || existingConfig.description,
      status: updateTenantDto.status || existingConfig.status,
      settings: {
        ...existingConfig.settings,
        ...updateTenantDto.settings,
      },
      updatedAt: new Date(),
    };

    this.tenantConfigs.set(tenantId, updatedConfig);
    this.logger.log(`Configuración actualizada para tenant: ${tenantId}`);
    
    return updatedConfig;
  }

  /**
   * Actualiza el estado de un tenant
   */
  async updateTenantStatus(tenantId: string, status: 'active' | 'inactive' | 'suspended'): Promise<void> {
    const config = this.tenantConfigs.get(tenantId);
    if (!config) {
      throw new Error(`Tenant no encontrado: ${tenantId}`);
    }

    config.status = status;
    config.updatedAt = new Date();
    
    this.tenantConfigs.set(tenantId, config);
    this.logger.log(`Estado actualizado para tenant ${tenantId}: ${status}`);
  }

  /**
   * Lista configuraciones de tenants
   */
  async listTenantConfigs(limit: number = 50, offset: number = 0): Promise<TenantConfig[]> {
    const configs = Array.from(this.tenantConfigs.values());
    return configs.slice(offset, offset + limit);
  }

  /**
   * Obtiene estadísticas de un tenant
   */
  async getTenantStats(tenantId: string): Promise<TenantStats> {
    // En una implementación real, esto vendría de la base de datos
    // Por ahora, retornamos datos mock
    return {
      tenantId,
      totalMessages: Math.floor(Math.random() * 10000),
      successfulMessages: Math.floor(Math.random() * 9000),
      failedMessages: Math.floor(Math.random() * 1000),
      totalPayments: Math.floor(Math.random() * 1000),
      successfulPayments: Math.floor(Math.random() * 900),
      failedPayments: Math.floor(Math.random() * 100),
      totalDeliveries: Math.floor(Math.random() * 500),
      successfulDeliveries: Math.floor(Math.random() * 450),
      failedDeliveries: Math.floor(Math.random() * 50),
      activeIntegrations: 3,
      lastActivity: new Date(),
    };
  }

  /**
   * Obtiene el número de tenants activos
   */
  async getActiveTenantsCount(): Promise<number> {
    return Array.from(this.tenantConfigs.values()).filter(config => config.status === 'active').length;
  }

  /**
   * Genera un ID único para el tenant
   */
  private generateTenantId(name: string): string {
    const sanitizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const randomSuffix = Math.random().toString(36).substr(2, 9);
    return `${sanitizedName}_${randomSuffix}`;
  }

  /**
   * Verifica si un tenant existe
   */
  async tenantExists(tenantId: string): Promise<boolean> {
    return this.tenantConfigs.has(tenantId);
  }

  /**
   * Obtiene la configuración de un proveedor específico
   */
  async getProviderConfig(tenantId: string, service: 'messaging' | 'payments' | 'delivery'): Promise<string | null> {
    const config = await this.getTenantConfig(tenantId);
    if (!config) {
      return null;
    }

    switch (service) {
      case 'messaging':
        return config.settings.messaging.defaultProvider;
      case 'payments':
        return config.settings.payments.defaultProvider;
      case 'delivery':
        return config.settings.delivery.defaultProvider;
      default:
        return null;
    }
  }

  /**
   * Actualiza la configuración de un proveedor
   */
  async updateProviderConfig(
    tenantId: string, 
    service: 'messaging' | 'payments' | 'delivery', 
    provider: string
  ): Promise<void> {
    const config = await this.getTenantConfig(tenantId);
    if (!config) {
      throw new Error(`Tenant no encontrado: ${tenantId}`);
    }

    switch (service) {
      case 'messaging':
        config.settings.messaging.defaultProvider = provider;
        break;
      case 'payments':
        config.settings.payments.defaultProvider = provider;
        break;
      case 'delivery':
        config.settings.delivery.defaultProvider = provider;
        break;
    }

    config.updatedAt = new Date();
    this.tenantConfigs.set(tenantId, config);
    
    this.logger.log(`Proveedor actualizado para tenant ${tenantId}: ${service} -> ${provider}`);
  }
}
