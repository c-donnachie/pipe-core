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

      // Insertar tenant con el schema completo estándar
      await this.databaseService.query(
        `INSERT INTO tenants (tenant_id, name, api_key, api_secret, status, settings, services)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          registerTenantDto.tenantId,
          registerTenantDto.tenantId, // Usar tenantId como name por defecto
          registerTenantDto.apiKey,
          registerTenantDto.apiSecret,
          'active',
          JSON.stringify(defaultSettings),
          JSON.stringify(registerTenantDto.services || {}),
        ]
      );

      this.logger.log(`Tenant registrado exitosamente: ${registerTenantDto.tenantId}`);

      // Registrar log (opcional, no crítico si falla)
      try {
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
      } catch (logError) {
        this.logger.warn(`No se pudo registrar el log: ${logError.message}`);
        // No lanzamos el error, el registro del tenant fue exitoso
      }

      return {
        success: true,
        tenantId: registerTenantDto.tenantId,
      };
    } catch (error) {
      this.logger.error(`Error registrando tenant: ${registerTenantDto.tenantId}`, error);
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
      'SELECT api_secret FROM tenants WHERE tenant_id = $1 AND status = $2',
      [tenantId, 'active']
    );

    return tenant?.api_secret || null;
  }

  /**
   * Verifica si un tenant existe y está activo
   */
  async validateTenant(tenantId: string): Promise<boolean> {
    const tenant = await this.databaseService.queryOne<{ tenant_id: string }>(
      'SELECT tenant_id FROM tenants WHERE tenant_id = $1 AND status = $2',
      [tenantId, 'active']
    );

    return !!tenant;
  }
}

