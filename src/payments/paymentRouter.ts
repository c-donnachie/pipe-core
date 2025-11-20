import { Injectable, Logger } from '@nestjs/common';
import { MercadoPagoAdapter } from './adapters/mercadoPagoAdapter';
import { TransbankAdapter } from './adapters/transbankAdapter';
import { StripeAdapter } from './adapters/stripeAdapter';
import { PaymentProviderConfig } from './interfaces';

@Injectable()
export class PaymentRouter {
  private readonly logger = new Logger(PaymentRouter.name);
  private tenantConfigs: Map<string, PaymentProviderConfig[]> = new Map();

  constructor(
    private readonly mercadoPagoAdapter: MercadoPagoAdapter,
    private readonly transbankAdapter: TransbankAdapter,
    private readonly stripeAdapter: StripeAdapter,
  ) {
    this.initializeDefaultConfigs();
  }

  /**
   * Inicializa configuraciones por defecto
   */
  private initializeDefaultConfigs(): void {
    // Configuración por defecto para TableFlow
    this.tenantConfigs.set('tableflow_123', [
      {
        provider: 'mercadopago',
        credentials: {
          accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
          publicKey: process.env.MERCADOPAGO_PUBLIC_KEY || '',
        },
        isActive: true,
        priority: 1,
      },
      {
        provider: 'transbank',
        credentials: {
          apiKey: process.env.TRANSBANK_API_KEY || '',
          commerceCode: process.env.TRANSBANK_COMMERCE_CODE || '',
        },
        isActive: true,
        priority: 2,
      },
    ]);

    // Configuración por defecto para Genda
    this.tenantConfigs.set('genda_456', [
      {
        provider: 'mercadopago',
        credentials: {
          accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
          publicKey: process.env.MERCADOPAGO_PUBLIC_KEY || '',
        },
        isActive: true,
        priority: 1,
      },
    ]);

    // Configuración por defecto para ROE
    this.tenantConfigs.set('roe_789', [
      {
        provider: 'stripe',
        credentials: {
          secretKey: process.env.STRIPE_SECRET_KEY || '',
          publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
        },
        isActive: true,
        priority: 1,
      },
    ]);

    this.logger.log(`Configuraciones de pagos inicializadas para ${this.tenantConfigs.size} tenants`);
  }

  /**
   * Obtiene el proveedor de pagos para un tenant
   */
  async getPaymentProvider(tenantId: string, amount?: number, currency?: string): Promise<any> {
    const configs = this.tenantConfigs.get(tenantId);
    
    if (!configs || configs.length === 0) {
      this.logger.warn(`No hay configuración de pagos para tenant: ${tenantId}`);
      return null;
    }

    // Obtener el proveedor activo con mayor prioridad
    const activeConfigs = configs.filter(config => config.isActive);
    if (activeConfigs.length === 0) {
      this.logger.warn(`No hay proveedores activos para tenant: ${tenantId}`);
      return null;
    }

    const selectedConfig = activeConfigs.sort((a, b) => a.priority - b.priority)[0];
    this.logger.log(`Seleccionado proveedor ${selectedConfig.provider} para tenant ${tenantId}`);

    // Seleccionar el adaptador correspondiente
    switch (selectedConfig.provider) {
      case 'mercadopago':
        return this.mercadoPagoAdapter;
      case 'transbank':
        return this.transbankAdapter;
      case 'stripe':
        return this.stripeAdapter;
      default:
        this.logger.error(`Proveedor no soportado: ${selectedConfig.provider}`);
        return null;
    }
  }

  /**
   * Configura un proveedor para un tenant
   */
  async setPaymentProvider(tenantId: string, provider: string, credentials: Record<string, any>): Promise<void> {
    const configs = this.tenantConfigs.get(tenantId) || [];
    
    // Actualizar o agregar configuración
    const existingIndex = configs.findIndex(config => config.provider === provider);
    
    const newConfig: PaymentProviderConfig = {
      provider,
      credentials,
      isActive: true,
      priority: existingIndex >= 0 ? configs[existingIndex].priority : configs.length + 1,
    };

    if (existingIndex >= 0) {
      configs[existingIndex] = newConfig;
    } else {
      configs.push(newConfig);
    }

    this.tenantConfigs.set(tenantId, configs);
    this.logger.log(`Proveedor ${provider} configurado para tenant ${tenantId}`);
  }

  /**
   * Obtiene la configuración de un tenant
   */
  async getTenantConfig(tenantId: string): Promise<PaymentProviderConfig[]> {
    return this.tenantConfigs.get(tenantId) || [];
  }

  /**
   * Obtiene el proveedor por defecto para un tenant
   */
  async getDefaultProvider(tenantId: string): Promise<PaymentProviderConfig | null> {
    const configs = await this.getTenantConfig(tenantId);
    const activeConfigs = configs.filter(config => config.isActive);
    
    if (activeConfigs.length === 0) {
      return null;
    }

    return activeConfigs.sort((a, b) => a.priority - b.priority)[0];
  }

  /**
   * Valida que un proveedor esté disponible
   */
  async validateProvider(tenantId: string, provider: string): Promise<boolean> {
    const configs = await this.getTenantConfig(tenantId);
    return configs.some(config => config.provider === provider && config.isActive);
  }

  /**
   * Obtiene todos los proveedores disponibles
   */
  getAvailableProviders(): string[] {
    return ['mercadopago', 'transbank', 'stripe'];
  }

  /**
   * Obtiene estadísticas de proveedores por tenant
   */
  async getProviderStats(tenantId: string): Promise<{
    totalProviders: number;
    activeProviders: number;
    providers: Array<{ provider: string; isActive: boolean; priority: number }>;
  }> {
    const configs = await this.getTenantConfig(tenantId);
    
    return {
      totalProviders: configs.length,
      activeProviders: configs.filter(config => config.isActive).length,
      providers: configs.map(config => ({
        provider: config.provider,
        isActive: config.isActive,
        priority: config.priority,
      })),
    };
  }
}
