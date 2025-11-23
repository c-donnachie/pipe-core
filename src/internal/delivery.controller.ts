import { Controller, Post, Body, Headers, UseGuards, HttpCode, HttpStatus, Logger, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { DatabaseService } from '../database/database.service';
import { UberTokenService } from './services/uber-token.service';
import { UberAuthService } from '../uber/uber-auth.service';
import { UberService } from '../uber/uber.service';
import { DeliveryQuoteInternalDto } from './interfaces/delivery-quote-internal.dto';
import { InternalApiGuard } from './guards/internal-api.guard';
import { env } from '../common/env';
import { UBER_CONSTANTS } from '../uber/constants';

@ApiTags('Internal API - Delivery')
@Controller('internal')
export class DeliveryController {
  private readonly logger = new Logger(DeliveryController.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly uberTokenService: UberTokenService,
    private readonly uberAuthService: UberAuthService,
    private readonly uberService: UberService,
  ) {}

  @Post('delivery-quotes')
  @HttpCode(HttpStatus.OK)
  @ApiHeader({ name: 'x-tenant-id', description: 'ID del tenant', required: true })
  @ApiHeader({ name: 'x-tenant-key', description: 'API Key del tenant', required: true })
  @ApiHeader({ name: 'x-tenant-secret', description: 'API Secret del tenant', required: true })
  @ApiOperation({
    summary: 'Crear cotización de entrega',
    description: 'Endpoint que valida las credenciales del tenant y maneja tokens de Uber automáticamente.'
  })
  @ApiResponse({
    status: 200,
    description: 'Cotización creada exitosamente',
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Headers faltantes' })
  @ApiResponse({ status: 401, description: 'No autorizado - Credenciales inválidas' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async createDeliveryQuote(
    @Body() dto: DeliveryQuoteInternalDto,
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-tenant-key') apiKey: string,
    @Headers('x-tenant-secret') apiSecret: string,
  ) {
    // Validar que los headers estén presentes
    if (!tenantId || !apiKey || !apiSecret) {
      throw new BadRequestException('Headers requeridos: x-tenant-id, x-tenant-key, x-tenant-secret');
    }

    this.logger.log(`Solicitud de cotización para tenant: ${tenantId}`);
    this.logger.debug(`API Key recibida: ${apiKey.substring(0, 10)}...`);
    this.logger.debug(`API Secret recibida: ${apiSecret.substring(0, 10)}...`);

    // 1. Validar tenant en la tabla tenants
    // Primero verificar si el tenant existe
    const tenantExists = await this.databaseService.queryOne<{
      tenant_id: string;
      api_key: string;
      api_secret: string;
      status: string;
    }>(
      `SELECT tenant_id, api_key, api_secret, status 
       FROM tenants 
       WHERE tenant_id = $1`,
      [tenantId]
    );

    if (!tenantExists) {
      this.logger.warn(`Tenant no encontrado: ${tenantId}`);
      throw new UnauthorizedException(`Tenant no encontrado: ${tenantId}`);
    }

    this.logger.debug(`Tenant encontrado. Status: ${tenantExists.status}`);
    this.logger.debug(`API Key en BD: ${tenantExists.api_key.substring(0, 10)}...`);
    this.logger.debug(`API Secret en BD: ${tenantExists.api_secret.substring(0, 10)}...`);

    // Verificar credenciales y status
    if (tenantExists.status !== 'active') {
      this.logger.warn(`Tenant inactivo: ${tenantId} (status: ${tenantExists.status})`);
      throw new UnauthorizedException(`Tenant inactivo: ${tenantId}`);
    }

    if (tenantExists.api_key !== apiKey) {
      this.logger.warn(`API Key no coincide para tenant: ${tenantId}`);
      throw new UnauthorizedException('API Key inválida');
    }

    if (tenantExists.api_secret !== apiSecret) {
      this.logger.warn(`API Secret no coincide para tenant: ${tenantId}`);
      throw new UnauthorizedException('API Secret inválida');
    }

    const tenant = tenantExists;

    this.logger.log(`Tenant validado: ${tenantId}`);

    // 2. Verificar si hay un token activo en uber_direct_tokens
    let uberToken = await this.uberTokenService.getActiveToken();

    // 3. Si no hay token activo, obtener uno nuevo
    if (!uberToken) {
      this.logger.log(`No hay token activo, generando nuevo token`);
      
      const tokenResponse = await this.uberAuthService.generateToken(
        UBER_CONSTANTS.DEFAULT_GRANT_TYPE,
        UBER_CONSTANTS.DEFAULT_SCOPE
      );

      // Guardar token en la base de datos
      uberToken = await this.uberTokenService.saveToken(
        tokenResponse.access_token,
        tokenResponse.expires_in
      );
    }

    // 4. Usar el token para crear la cotización
    const customerId = env.uber.customerId;
    if (!customerId) {
      throw new Error('UBER_DIRECT_CUSTOMER_ID no está configurado');
    }

    // Convertir DTO a formato de Uber (las direcciones se pasan como strings JSON)
    const quoteData = {
      pickup_address: dto.pickup_address, // Ya viene como string JSON
      dropoff_address: dto.dropoff_address, // Ya viene como string JSON
      pickup_latitude: dto.pickup_latitude,
      pickup_longitude: dto.pickup_longitude,
      dropoff_latitude: dto.dropoff_latitude,
      dropoff_longitude: dto.dropoff_longitude,
      pickup_ready_dt: dto.pickup_ready_dt,
      pickup_deadline_dt: dto.pickup_deadline_dt,
      dropoff_ready_dt: dto.dropoff_ready_dt,
      dropoff_deadline_dt: dto.dropoff_deadline_dt,
      pickup_phone_number: dto.pickup_phone_number,
      dropoff_phone_number: dto.dropoff_phone_number,
      manifest_total_value: dto.manifest_total_value,
      external_store_id: dto.external_store_id,
    };

    // Llamar al servicio de Uber con el token
    const quote = await this.uberService.createQuote(
      customerId,
      quoteData,
      uberToken.access_token
    );

    this.logger.log(`Cotización creada exitosamente para tenant: ${tenantId}`);
    return quote;
  }
}

