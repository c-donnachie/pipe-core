import { Injectable, Logger } from '@nestjs/common';
import { TenantConfigService } from './services/tenantConfig.service';
import { TenantCredentialsService } from './services/tenantCredentials.service';
import { TenantValidationService } from './services/tenantValidation.service';
import { 
  Tenant, 
  TenantConfig, 
  TenantCredentials, 
  TenantStats,
  CreateTenantDto,
  UpdateTenantDto 
} from './interfaces';

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(
    private readonly tenantConfigService: TenantConfigService,
    private readonly tenantCredentialsService: TenantCredentialsService,
    private readonly tenantValidationService: TenantValidationService,
  ) {}

  /**
   * Crea un nuevo tenant
   */
  async createTenant(createTenantDto: CreateTenantDto): Promise<Tenant> {
    this.logger.log(`Creando tenant: ${createTenantDto.name}`);
    
    // Validar datos del tenant
    await this.tenantValidationService.validateTenantData(createTenantDto);
    
    // Crear configuración básica
    const tenantConfig = await this.tenantConfigService.createTenantConfig(createTenantDto);
    
    // Crear credenciales por defecto
    await this.tenantCredentialsService.createDefaultCredentials(tenantConfig.tenantId);
    
    this.logger.log(`Tenant creado exitosamente: ${tenantConfig.tenantId}`);
    
    return {
      tenantId: tenantConfig.tenantId,
      name: createTenantDto.name,
      description: createTenantDto.description,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Obtiene un tenant por ID
   */
  async getTenant(tenantId: string): Promise<Tenant | null> {
    this.logger.log(`Obteniendo tenant: ${tenantId}`);
    
    const tenantConfig = await this.tenantConfigService.getTenantConfig(tenantId);
    if (!tenantConfig) {
      return null;
    }

    return {
      tenantId: tenantConfig.tenantId,
      name: tenantConfig.name,
      description: tenantConfig.description,
      status: tenantConfig.status,
      createdAt: tenantConfig.createdAt,
      updatedAt: tenantConfig.updatedAt,
    };
  }

  /**
   * Actualiza un tenant
   */
  async updateTenant(tenantId: string, updateTenantDto: UpdateTenantDto): Promise<Tenant> {
    this.logger.log(`Actualizando tenant: ${tenantId}`);
    
    // Validar datos de actualización
    await this.tenantValidationService.validateTenantUpdate(tenantId, updateTenantDto);
    
    // Actualizar configuración
    const updatedConfig = await this.tenantConfigService.updateTenantConfig(tenantId, updateTenantDto);
    
    this.logger.log(`Tenant actualizado exitosamente: ${tenantId}`);
    
    return {
      tenantId: updatedConfig.tenantId,
      name: updatedConfig.name,
      description: updatedConfig.description,
      status: updatedConfig.status,
      createdAt: updatedConfig.createdAt,
      updatedAt: updatedConfig.updatedAt,
    };
  }

  /**
   * Obtiene las credenciales de un tenant
   */
  async getTenantCredentials(tenantId: string, provider?: string): Promise<TenantCredentials[]> {
    this.logger.log(`Obteniendo credenciales para tenant: ${tenantId}${provider ? `, proveedor: ${provider}` : ''}`);
    
    return await this.tenantCredentialsService.getTenantCredentials(tenantId, provider);
  }

  /**
   * Actualiza las credenciales de un tenant
   */
  async updateTenantCredentials(
    tenantId: string, 
    provider: string, 
    credentials: Record<string, any>
  ): Promise<TenantCredentials> {
    this.logger.log(`Actualizando credenciales para tenant: ${tenantId}, proveedor: ${provider}`);
    
    // Validar credenciales
    await this.tenantValidationService.validateCredentials(provider, credentials);
    
    // Actualizar credenciales
    const updatedCredentials = await this.tenantCredentialsService.updateTenantCredentials(
      tenantId, 
      provider, 
      credentials
    );
    
    this.logger.log(`Credenciales actualizadas exitosamente para tenant: ${tenantId}`);
    
    return updatedCredentials;
  }

  /**
   * Obtiene estadísticas de un tenant
   */
  async getTenantStats(tenantId: string): Promise<TenantStats> {
    this.logger.log(`Obteniendo estadísticas para tenant: ${tenantId}`);
    
    const stats = await this.tenantConfigService.getTenantStats(tenantId);
    
    return {
      tenantId,
      totalMessages: stats.totalMessages || 0,
      successfulMessages: stats.successfulMessages || 0,
      failedMessages: stats.failedMessages || 0,
      totalPayments: stats.totalPayments || 0,
      successfulPayments: stats.successfulPayments || 0,
      failedPayments: stats.failedPayments || 0,
      totalDeliveries: 0,
      successfulDeliveries: 0,
      failedDeliveries: 0,
      activeIntegrations: stats.activeIntegrations || 0,
      lastActivity: stats.lastActivity,
    };
  }

  /**
   * Lista todos los tenants
   */
  async listTenants(limit: number = 50, offset: number = 0): Promise<Tenant[]> {
    this.logger.log(`Listando tenants (limit: ${limit}, offset: ${offset})`);
    
    const tenantConfigs = await this.tenantConfigService.listTenantConfigs(limit, offset);
    
    return tenantConfigs.map(config => ({
      tenantId: config.tenantId,
      name: config.name,
      description: config.description,
      status: config.status,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    }));
  }

  /**
   * Desactiva un tenant
   */
  async deactivateTenant(tenantId: string): Promise<void> {
    this.logger.log(`Desactivando tenant: ${tenantId}`);
    
    await this.tenantConfigService.updateTenantStatus(tenantId, 'inactive');
    await this.tenantCredentialsService.deactivateTenantCredentials(tenantId);
    
    this.logger.log(`Tenant desactivado exitosamente: ${tenantId}`);
  }

  /**
   * Activa un tenant
   */
  async activateTenant(tenantId: string): Promise<void> {
    this.logger.log(`Activando tenant: ${tenantId}`);
    
    await this.tenantConfigService.updateTenantStatus(tenantId, 'active');
    
    this.logger.log(`Tenant activado exitosamente: ${tenantId}`);
  }

  /**
   * Health check del servicio
   */
  async healthCheck(): Promise<{ status: string; timestamp: string; tenants: number }> {
    const tenantCount = await this.tenantConfigService.getActiveTenantsCount();
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      tenants: tenantCount,
    };
  }
}
