import { Injectable, Logger, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { RegisterTenantDto } from './interfaces/register-tenant.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Registra un nuevo tenant desde Supabase
   */
  async registerTenant(registerTenantDto: RegisterTenantDto): Promise<{ success: boolean; tenantId: string }> {
    this.logger.log(`Registrando tenant: ${registerTenantDto.tenantId}`);

    try {
      // Verificar si el tenant ya existe
      const existingTenant = await this.databaseService.queryOne<{ tenant_id: string }>(
        'SELECT tenant_id FROM tenants WHERE tenant_id = $1',
        [registerTenantDto.tenantId]
      );

      if (existingTenant) {
        this.logger.warn(`Tenant ya existe: ${registerTenantDto.tenantId}`);
        throw new ConflictException(`El tenant ${registerTenantDto.tenantId} ya está registrado`);
      }

      // Crear el tenant en la base de datos
      const defaultSettings = {
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

      // Verificar qué columnas tiene la tabla
      const tableColumns = await this.databaseService.query<{ column_name: string }>(
        `SELECT column_name 
         FROM information_schema.columns 
         WHERE table_name = 'tenants' 
         ORDER BY ordinal_position`
      );
      
      const columnNames = tableColumns.map(col => col.column_name);
      const hasStatus = columnNames.includes('status');
      const hasIsActive = columnNames.includes('is_active');
      const hasName = columnNames.includes('name');
      const hasSettings = columnNames.includes('settings');
      const hasServices = columnNames.includes('services');

      // Construir query dinámicamente según las columnas disponibles
      if (hasStatus && hasName && hasSettings && hasServices) {
        // Schema completo
        await this.databaseService.query(
          `INSERT INTO tenants (tenant_id, name, api_key, api_secret, status, settings, services)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            registerTenantDto.tenantId,
            registerTenantDto.tenantId,
            registerTenantDto.apiKey,
            registerTenantDto.apiSecret,
            'active',
            JSON.stringify(defaultSettings),
            JSON.stringify(registerTenantDto.services || {}),
          ]
        );
      } else if (hasIsActive) {
        // Schema mínimo con is_active
        await this.databaseService.query(
          `INSERT INTO tenants (tenant_id, api_key, api_secret, is_active)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (tenant_id) DO NOTHING`,
          [
            registerTenantDto.tenantId,
            registerTenantDto.apiKey,
            registerTenantDto.apiSecret,
            true,
          ]
        );
      } else {
        // Schema mínimo sin is_active
        await this.databaseService.query(
          `INSERT INTO tenants (tenant_id, api_key, api_secret)
           VALUES ($1, $2, $3)
           ON CONFLICT (tenant_id) DO NOTHING`,
          [
            registerTenantDto.tenantId,
            registerTenantDto.apiKey,
            registerTenantDto.apiSecret,
          ]
        );
      }

      this.logger.log(`Tenant registrado exitosamente: ${registerTenantDto.tenantId}`);

      // Registrar log
      await this.databaseService.query(
        `INSERT INTO tenant_logs (tenant_id, service, action, status, details)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          registerTenantDto.tenantId,
          'auth',
          'register_tenant',
          'success',
          JSON.stringify({ source: 'supabase' }),
        ]
      );

      return {
        success: true,
        tenantId: registerTenantDto.tenantId,
      };
    } catch (error) {
      this.logger.error(`Error registrando tenant: ${registerTenantDto.tenantId}`, error);

      if (error instanceof ConflictException) {
        throw error;
      }

      throw new InternalServerErrorException('Error al registrar tenant');
    }
  }

  /**
   * Obtiene el api_secret de un tenant para validar JWT
   */
  async getTenantSecret(tenantId: string): Promise<string | null> {
    // Intentar con status primero, luego con is_active
    let tenant = await this.databaseService.queryOne<{ api_secret: string }>(
      'SELECT api_secret FROM tenants WHERE tenant_id = $1 AND status = $2',
      [tenantId, 'active']
    );

    if (!tenant) {
      // Intentar con is_active
      tenant = await this.databaseService.queryOne<{ api_secret: string }>(
        'SELECT api_secret FROM tenants WHERE tenant_id = $1 AND is_active = $2',
        [tenantId, true]
      );
    }

    if (!tenant) {
      // Intentar sin filtro de estado
      tenant = await this.databaseService.queryOne<{ api_secret: string }>(
        'SELECT api_secret FROM tenants WHERE tenant_id = $1',
        [tenantId]
      );
    }

    return tenant?.api_secret || null;
  }

  /**
   * Verifica si un tenant existe y está activo
   */
  async validateTenant(tenantId: string): Promise<boolean> {
    // Intentar con status primero
    let tenant = await this.databaseService.queryOne<{ tenant_id: string }>(
      'SELECT tenant_id FROM tenants WHERE tenant_id = $1 AND status = $2',
      [tenantId, 'active']
    );

    if (!tenant) {
      // Intentar con is_active
      tenant = await this.databaseService.queryOne<{ tenant_id: string }>(
        'SELECT tenant_id FROM tenants WHERE tenant_id = $1 AND is_active = $2',
        [tenantId, true]
      );
    }

    if (!tenant) {
      // Intentar sin filtro de estado
      tenant = await this.databaseService.queryOne<{ tenant_id: string }>(
        'SELECT tenant_id FROM tenants WHERE tenant_id = $1',
        [tenantId]
      );
    }

    return !!tenant;
  }
}

