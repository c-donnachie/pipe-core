import { Injectable, Logger, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { RegisterTenantDto } from '../internal/interfaces/register-tenant.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Registra un nuevo tenant desde Supabase
   */
  async registerTenant(registerTenantDto: RegisterTenantDto): Promise<{ success: boolean; id: string }> {
    this.logger.log(`Registrando nuevo tenant con API Key: ${registerTenantDto.apiKey.substring(0, 10)}...`);

    try {
      // Verificar si el tenant ya existe (por api_key)
      const existingTenant = await this.databaseService.queryOne<{ id: string }>(
        'SELECT id FROM tenants WHERE api_key = $1',
        [registerTenantDto.apiKey]
      );

      if (existingTenant) {
        this.logger.warn(`Tenant ya existe con API Key: ${registerTenantDto.apiKey.substring(0, 10)}...`);
        throw new ConflictException(`El tenant con esta API Key ya está registrado`);
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

      // Insertar tenant con el schema completo estándar (id se genera automáticamente como UUID)
      const result = await this.databaseService.query<{ id: string }>(
        `INSERT INTO tenants (name, description, api_key, api_secret, status, settings, services)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
          [
          registerTenantDto.name || null,
          registerTenantDto.description || null,
            registerTenantDto.apiKey,
            registerTenantDto.apiSecret,
            'active',
            JSON.stringify(defaultSettings),
            JSON.stringify(registerTenantDto.services || {}),
          ]
        );

      const tenantId = result[0].id;
      this.logger.log(`Tenant registrado exitosamente con ID: ${tenantId}`);

      // Registrar log (opcional, no crítico si falla)
      try {
      await this.databaseService.query(
        `INSERT INTO tenant_logs (tenant_id, service, action, status, details)
         VALUES ($1, $2, $3, $4, $5)`,
        [
            tenantId,
          'auth',
          'register_tenant',
          'success',
          JSON.stringify({ source: 'supabase' }),
        ]
      );
      } catch (logError) {
        this.logger.warn(`No se pudo registrar el log: ${logError.message}`);
        // No lanzamos el error, el registro del tenant fue exitoso
      }

      return {
        success: true,
        id: tenantId,
      };
    } catch (error) {
      this.logger.error(`Error registrando tenant`, error);
      this.logger.error(`Error details: ${error.message}`, error.stack);

      if (error instanceof ConflictException) {
        throw error;
      }

      // Proporcionar más información sobre el error
      const errorMessage = error.message || 'Error desconocido';
      throw new InternalServerErrorException(`Error al registrar tenant: ${errorMessage}`);
    }
  }

  /**
   * Obtiene el api_secret de un tenant para validar JWT
   */
  async getTenantSecret(tenantId: string): Promise<string | null> {
    const tenant = await this.databaseService.queryOne<{ api_secret: string }>(
      'SELECT api_secret FROM tenants WHERE id = $1 AND status = $2',
      [tenantId, 'active']
    );

    return tenant?.api_secret || null;
  }

  /**
   * Verifica si un tenant existe y está activo
   */
  async validateTenant(tenantId: string): Promise<boolean> {
    const tenant = await this.databaseService.queryOne<{ id: string }>(
      'SELECT id FROM tenants WHERE id = $1 AND status = $2',
      [tenantId, 'active']
    );

    return !!tenant;
  }
}

