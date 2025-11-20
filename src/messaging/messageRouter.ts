import { Injectable, Logger } from '@nestjs/common';
import { env } from '../common/env';

export interface ProviderConfig {
  provider: 'twilio' | 'meta' | 'sendgrid' | 'resend' | 'expo';
  credentials: Record<string, any>;
  isActive: boolean;
}

export interface TenantProviderConfig {
  tenantId: string;
  channels: {
    whatsapp?: ProviderConfig;
    sms?: ProviderConfig;
    email?: ProviderConfig;
    push?: ProviderConfig;
  };
}

@Injectable()
export class MessageRouter {
  private readonly logger = new Logger(MessageRouter.name);
  private tenantConfigs: Map<string, TenantProviderConfig> = new Map();

  constructor() {
    this.initializeDefaultConfigs();
  }

  /**
   * Obtiene el proveedor configurado para un tenant y canal específico
   */
  async getProvider(tenantId: string, channel: 'whatsapp' | 'sms' | 'email' | 'push'): Promise<ProviderConfig> {
    this.logger.log(`Obteniendo proveedor para tenant ${tenantId} en canal ${channel}`);

    const tenantConfig = this.tenantConfigs.get(tenantId);
    
    if (!tenantConfig) {
      this.logger.warn(`Configuración no encontrada para tenant ${tenantId}, usando configuración por defecto`);
      return this.getDefaultProvider(channel);
    }

    const channelConfig = tenantConfig.channels[channel];
    
    if (!channelConfig || !channelConfig.isActive) {
      this.logger.warn(`Proveedor no configurado o inactivo para tenant ${tenantId} en canal ${channel}, usando configuración por defecto`);
      return this.getDefaultProvider(channel);
    }

    return channelConfig;
  }

  /**
   * Obtiene el proveedor por defecto para un canal
   */
  private getDefaultProvider(channel: 'whatsapp' | 'sms' | 'email' | 'push'): ProviderConfig {
    const defaultProviders = {
      whatsapp: {
        provider: 'twilio' as const,
        credentials: {
          accountSid: env.twilio.accountSid,
          authToken: env.twilio.authToken,
          whatsappNumber: env.twilio.whatsappNumber,
        },
        isActive: true,
      },
      sms: {
        provider: 'twilio' as const,
        credentials: {
          accountSid: env.twilio.accountSid,
          authToken: env.twilio.authToken,
          phoneNumber: env.twilio.phoneNumber,
        },
        isActive: true,
      },
      email: {
        provider: 'resend' as const, // Cambiado a Resend por defecto
        credentials: {
          apiKey: env.resend.apiKey,
          fromEmail: env.resend.fromEmail,
        },
        isActive: true,
      },
      push: {
        provider: 'expo' as const,
        credentials: {
          accessToken: process.env.EXPO_ACCESS_TOKEN || '',
        },
        isActive: true,
      },
    };

    return defaultProviders[channel];
  }

  /**
   * Configura un proveedor para un tenant específico
   */
  async setProvider(
    tenantId: string, 
    channel: 'whatsapp' | 'sms' | 'email' | 'push',
    providerConfig: ProviderConfig
  ): Promise<void> {
    this.logger.log(`Configurando proveedor ${providerConfig.provider} para tenant ${tenantId} en canal ${channel}`);

    let tenantConfig = this.tenantConfigs.get(tenantId);
    
    if (!tenantConfig) {
      tenantConfig = {
        tenantId,
        channels: {},
      };
      this.tenantConfigs.set(tenantId, tenantConfig);
    }

    tenantConfig.channels[channel] = providerConfig;
    this.tenantConfigs.set(tenantId, tenantConfig);
  }

  /**
   * Obtiene todos los proveedores configurados para un tenant
   */
  async getTenantProviders(tenantId: string): Promise<TenantProviderConfig | null> {
    return this.tenantConfigs.get(tenantId) || null;
  }

  /**
   * Obtiene estadísticas de proveedores por tenant
   */
  async getProviderStats(): Promise<Record<string, any>> {
    const stats: Record<string, any> = {
      totalTenants: this.tenantConfigs.size,
      providers: {
        twilio: { tenants: 0, channels: { whatsapp: 0, sms: 0 } },
        meta: { tenants: 0, channels: { whatsapp: 0 } },
        sendgrid: { tenants: 0, channels: { email: 0 } },
        resend: { tenants: 0, channels: { email: 0 } },
        expo: { tenants: 0, channels: { push: 0 } },
      },
    };

    for (const [tenantId, config] of this.tenantConfigs.entries()) {
      for (const [channel, providerConfig] of Object.entries(config.channels)) {
        if (providerConfig && providerConfig.isActive) {
          stats.providers[providerConfig.provider].tenants++;
          stats.providers[providerConfig.provider].channels[channel]++;
        }
      }
    }

    return stats;
  }

  /**
   * Inicializa configuraciones por defecto para algunos tenants de ejemplo
   */
  private initializeDefaultConfigs(): void {
    // Tenant de ejemplo con configuración completa
    this.tenantConfigs.set('tableflow_123', {
      tenantId: 'tableflow_123',
      channels: {
        whatsapp: {
          provider: 'twilio',
          credentials: {
            accountSid: env.twilio.accountSid,
            authToken: env.twilio.authToken,
            whatsappNumber: env.twilio.whatsappNumber,
          },
          isActive: true,
        },
        sms: {
          provider: 'twilio',
          credentials: {
            accountSid: env.twilio.accountSid,
            authToken: env.twilio.authToken,
            phoneNumber: env.twilio.phoneNumber,
          },
          isActive: true,
        },
        email: {
          provider: 'sendgrid',
          credentials: {
            apiKey: process.env.SENDGRID_API_KEY || '',
            fromEmail: 'noreply@tableflow.com',
          },
          isActive: true,
        },
      },
    });

    // Tenant de ejemplo usando Meta para WhatsApp y Resend para Email
    this.tenantConfigs.set('genda_456', {
      tenantId: 'genda_456',
      channels: {
        whatsapp: {
          provider: 'meta',
          credentials: {
            accessToken: process.env.META_ACCESS_TOKEN || '',
            phoneNumberId: process.env.META_PHONE_NUMBER_ID || '',
            verifyToken: process.env.META_VERIFY_TOKEN || '',
          },
          isActive: true,
        },
        email: {
          provider: 'resend',
          credentials: {
            apiKey: process.env.RESEND_API_KEY || '',
            fromEmail: 'noreply@genda.com',
          },
          isActive: true,
        },
      },
    });

    // Tenant de ejemplo usando SendGrid para Email
    this.tenantConfigs.set('roe_789', {
      tenantId: 'roe_789',
      channels: {
        email: {
          provider: 'sendgrid',
          credentials: {
            apiKey: process.env.SENDGRID_API_KEY || '',
            fromEmail: 'noreply@roe.com',
          },
          isActive: true,
        },
        sms: {
          provider: 'twilio',
          credentials: {
            accountSid: env.twilio.accountSid,
            authToken: env.twilio.authToken,
            phoneNumber: env.twilio.phoneNumber,
          },
          isActive: true,
        },
      },
    });

    this.logger.log(`Configuraciones por defecto inicializadas para ${this.tenantConfigs.size} tenants`);
  }

  /**
   * Valida que un proveedor esté configurado correctamente
   */
  async validateProvider(tenantId: string, channel: 'whatsapp' | 'sms' | 'email' | 'push'): Promise<boolean> {
    try {
      const provider = await this.getProvider(tenantId, channel);
      
      if (!provider.isActive) {
        this.logger.warn(`Proveedor ${provider.provider} inactivo para tenant ${tenantId} en canal ${channel}`);
        return false;
      }

      // Validaciones específicas por proveedor
      switch (provider.provider) {
        case 'twilio':
          return !!(provider.credentials.accountSid && provider.credentials.authToken);
        case 'meta':
          return !!(provider.credentials.accessToken && provider.credentials.phoneNumberId);
        case 'sendgrid':
        case 'resend':
          return !!(provider.credentials.apiKey);
        case 'expo':
          return !!(provider.credentials.accessToken);
        default:
          return false;
      }
    } catch (error) {
      this.logger.error(`Error validando proveedor para tenant ${tenantId} en canal ${channel}:`, error);
      return false;
    }
  }
}
