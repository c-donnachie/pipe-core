import { Injectable, Logger } from '@nestjs/common';
import { TenantCredentials } from '../interfaces';

@Injectable()
export class TenantCredentialsService {
  private readonly logger = new Logger(TenantCredentialsService.name);
  private tenantCredentials: Map<string, TenantCredentials[]> = new Map();

  constructor() {
    this.initializeDefaultCredentials();
  }

  /**
   * Inicializa credenciales por defecto
   */
  private initializeDefaultCredentials(): void {
    // Credenciales por defecto para TableFlow
    this.setTenantCredentials('tableflow_123', [
      {
        tenantId: 'tableflow_123',
        provider: 'resend',
        channel: 'email',
        credentials: {
          apiKey: process.env.RESEND_API_KEY || 're_default_key',
          fromEmail: 'noreply@tableflow.com',
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        tenantId: 'tableflow_123',
        provider: 'twilio',
        channel: 'whatsapp',
        credentials: {
          apiKey: process.env.TWILIO_ACCOUNT_SID || 'AC_default_sid',
          secretKey: process.env.TWILIO_AUTH_TOKEN || 'default_token',
          fromPhone: process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886',
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Credenciales por defecto para Genda
    this.setTenantCredentials('genda_456', [
      {
        tenantId: 'genda_456',
        provider: 'resend',
        channel: 'email',
        credentials: {
          apiKey: process.env.RESEND_API_KEY || 're_default_key',
          fromEmail: 'noreply@genda.com',
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        tenantId: 'genda_456',
        provider: 'meta',
        channel: 'whatsapp',
        credentials: {
          apiKey: process.env.META_ACCESS_TOKEN || 'meta_default_token',
          fromPhone: process.env.META_PHONE_NUMBER_ID || 'default_phone_id',
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Credenciales por defecto para ROE
    this.setTenantCredentials('roe_789', [
      {
        tenantId: 'roe_789',
        provider: 'sendgrid',
        channel: 'email',
        credentials: {
          apiKey: process.env.SENDGRID_API_KEY || 'SG.default_key',
          fromEmail: 'noreply@roe.com',
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        tenantId: 'roe_789',
        provider: 'twilio',
        channel: 'sms',
        credentials: {
          apiKey: process.env.TWILIO_ACCOUNT_SID || 'AC_default_sid',
          secretKey: process.env.TWILIO_AUTH_TOKEN || 'default_token',
          fromPhone: process.env.TWILIO_PHONE_NUMBER || '+1234567890',
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    this.logger.log(`Credenciales por defecto inicializadas para ${this.tenantCredentials.size} tenants`);
  }

  /**
   * Establece las credenciales de un tenant
   */
  private setTenantCredentials(tenantId: string, credentials: TenantCredentials[]): void {
    this.tenantCredentials.set(tenantId, credentials);
  }

  /**
   * Crea credenciales por defecto para un nuevo tenant
   */
  async createDefaultCredentials(tenantId: string): Promise<void> {
    const defaultCredentials: TenantCredentials[] = [
      {
        tenantId,
        provider: 'resend',
        channel: 'email',
        credentials: {
          apiKey: process.env.RESEND_API_KEY || 're_default_key',
          fromEmail: `noreply@${tenantId}.com`,
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    this.setTenantCredentials(tenantId, defaultCredentials);
    this.logger.log(`Credenciales por defecto creadas para tenant: ${tenantId}`);
  }

  /**
   * Obtiene las credenciales de un tenant
   */
  async getTenantCredentials(tenantId: string, provider?: string): Promise<TenantCredentials[]> {
    const credentials = this.tenantCredentials.get(tenantId) || [];
    
    if (provider) {
      return credentials.filter(cred => cred.provider === provider);
    }
    
    return credentials;
  }

  /**
   * Obtiene credenciales específicas de un tenant y proveedor
   */
  async getTenantProviderCredentials(
    tenantId: string, 
    provider: string, 
    channel?: string
  ): Promise<TenantCredentials | null> {
    const credentials = await this.getTenantCredentials(tenantId, provider);
    
    if (channel) {
      return credentials.find(cred => cred.channel === channel) || null;
    }
    
    return credentials[0] || null;
  }

  /**
   * Actualiza las credenciales de un tenant para un proveedor
   */
  async updateTenantCredentials(
    tenantId: string, 
    provider: string, 
    credentials: Record<string, any>
  ): Promise<TenantCredentials> {
    const existingCredentials = this.tenantCredentials.get(tenantId) || [];
    
    // Buscar credenciales existentes del proveedor
    const existingIndex = existingCredentials.findIndex(cred => cred.provider === provider);
    
    const updatedCredentials: TenantCredentials = {
      tenantId,
      provider,
      channel: credentials.channel || 'general',
      credentials: {
        apiKey: credentials.apiKey || credentials.accessToken || credentials.clientId || '',
        secretKey: credentials.secretKey || credentials.secret || credentials.clientSecret,
        fromEmail: credentials.fromEmail,
        fromPhone: credentials.fromPhone,
        webhookUrl: credentials.webhookUrl,
        ...credentials,
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (existingIndex >= 0) {
      // Actualizar credenciales existentes
      updatedCredentials.createdAt = existingCredentials[existingIndex].createdAt;
      existingCredentials[existingIndex] = updatedCredentials;
    } else {
      // Agregar nuevas credenciales
      existingCredentials.push(updatedCredentials);
    }

    this.setTenantCredentials(tenantId, existingCredentials);
    this.logger.log(`Credenciales actualizadas para tenant ${tenantId}, proveedor ${provider}`);
    
    return updatedCredentials;
  }

  /**
   * Agrega nuevas credenciales para un tenant
   */
  async addTenantCredentials(tenantCredentials: TenantCredentials): Promise<TenantCredentials> {
    const { tenantId, provider, channel } = tenantCredentials;
    const existingCredentials = this.tenantCredentials.get(tenantId) || [];
    
    // Verificar si ya existen credenciales para este proveedor y canal
    const existingIndex = existingCredentials.findIndex(
      cred => cred.provider === provider && cred.channel === channel
    );

    if (existingIndex >= 0) {
      throw new Error(`Credenciales ya existen para tenant ${tenantId}, proveedor ${provider}, canal ${channel}`);
    }

    existingCredentials.push(tenantCredentials);
    this.setTenantCredentials(tenantId, existingCredentials);
    
    this.logger.log(`Nuevas credenciales agregadas para tenant ${tenantId}, proveedor ${provider}`);
    
    return tenantCredentials;
  }

  /**
   * Elimina credenciales de un tenant
   */
  async removeTenantCredentials(
    tenantId: string, 
    provider: string, 
    channel?: string
  ): Promise<void> {
    const existingCredentials = this.tenantCredentials.get(tenantId) || [];
    
    let filteredCredentials: TenantCredentials[];
    
    if (channel) {
      filteredCredentials = existingCredentials.filter(
        cred => !(cred.provider === provider && cred.channel === channel)
      );
    } else {
      filteredCredentials = existingCredentials.filter(cred => cred.provider !== provider);
    }

    this.setTenantCredentials(tenantId, filteredCredentials);
    this.logger.log(`Credenciales eliminadas para tenant ${tenantId}, proveedor ${provider}`);
  }

  /**
   * Desactiva todas las credenciales de un tenant
   */
  async deactivateTenantCredentials(tenantId: string): Promise<void> {
    const existingCredentials = this.tenantCredentials.get(tenantId) || [];
    
    const updatedCredentials = existingCredentials.map(cred => ({
      ...cred,
      isActive: false,
      updatedAt: new Date(),
    }));

    this.setTenantCredentials(tenantId, updatedCredentials);
    this.logger.log(`Todas las credenciales desactivadas para tenant: ${tenantId}`);
  }

  /**
   * Activa credenciales de un tenant
   */
  async activateTenantCredentials(tenantId: string): Promise<void> {
    const existingCredentials = this.tenantCredentials.get(tenantId) || [];
    
    const updatedCredentials = existingCredentials.map(cred => ({
      ...cred,
      isActive: true,
      updatedAt: new Date(),
    }));

    this.setTenantCredentials(tenantId, updatedCredentials);
    this.logger.log(`Todas las credenciales activadas para tenant: ${tenantId}`);
  }

  /**
   * Verifica si un tenant tiene credenciales activas
   */
  async hasActiveCredentials(tenantId: string, provider?: string): Promise<boolean> {
    const credentials = await this.getTenantCredentials(tenantId, provider);
    return credentials.some(cred => cred.isActive);
  }

  /**
   * Obtiene todos los proveedores activos de un tenant
   */
  async getActiveProviders(tenantId: string): Promise<string[]> {
    const credentials = await this.getTenantCredentials(tenantId);
    const activeProviders = credentials
      .filter(cred => cred.isActive)
      .map(cred => cred.provider);
    
    return [...new Set(activeProviders)]; // Eliminar duplicados
  }

  /**
   * Valida las credenciales de un tenant
   */
  async validateCredentials(tenantId: string, provider: string): Promise<boolean> {
    const credentials = await this.getTenantProviderCredentials(tenantId, provider);
    
    if (!credentials || !credentials.isActive) {
      return false;
    }

    // Aquí se implementaría la validación real con el proveedor
    // Por ahora, solo verificamos que existan las credenciales básicas
    const requiredFields = ['apiKey'];
    return requiredFields.every(field => credentials.credentials[field]);
  }

  /**
   * Obtiene estadísticas de credenciales de un tenant
   */
  async getCredentialsStats(tenantId: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    byProvider: Record<string, number>;
    byChannel: Record<string, number>;
  }> {
    const credentials = await this.getTenantCredentials(tenantId);
    
    const stats = {
      total: credentials.length,
      active: credentials.filter(cred => cred.isActive).length,
      inactive: credentials.filter(cred => !cred.isActive).length,
      byProvider: {} as Record<string, number>,
      byChannel: {} as Record<string, number>,
    };

    // Contar por proveedor
    credentials.forEach(cred => {
      stats.byProvider[cred.provider] = (stats.byProvider[cred.provider] || 0) + 1;
    });

    // Contar por canal
    credentials.forEach(cred => {
      stats.byChannel[cred.channel] = (stats.byChannel[cred.channel] || 0) + 1;
    });

    return stats;
  }
}
