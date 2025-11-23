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
  @ApiHeader({ 
    name: 'x-tenant-key', 
    description: `API Key pública del tenant.
    
**Tipo:** String
**Formato:** Prefijo recomendado \`pk_live_\` o \`pk_test_\` seguido de caracteres alfanuméricos
**Ejemplo:** "example_key"
**Uso:** Se usa junto con \`x-tenant-secret\` para identificar y validar al tenant
**Validación:** Debe existir un tenant activo con esta API Key en la base de datos`,
    required: true,
    example: 'example_key'
  })
  @ApiHeader({ 
    name: 'x-tenant-secret', 
    description: `API Secret del tenant (usado para validar credenciales).
    
**Tipo:** String
**Formato:** Prefijo recomendado \`sk_live_\` o \`sk_test_\` seguido de caracteres alfanuméricos
**Ejemplo:** "demo_123"
**Seguridad:** ⚠️ **NUNCA** debe exponerse al frontend o en logs públicos
**Uso:** Se usa junto con \`x-tenant-key\` para validar las credenciales del tenant
**Validación:** Debe coincidir con el \`api_secret\` del tenant en la base de datos`,
    required: true,
    example: 'demo_123'
  })
  @ApiOperation({
    summary: 'Crear cotización de entrega',
    description: `Crea una cotización de entrega usando Uber Direct API.

Este endpoint valida las credenciales del tenant mediante \`api_key\` y \`api_secret\` y maneja tokens de Uber automáticamente.

**Autenticación:**
La autenticación se realiza mediante los headers \`x-tenant-key\` y \`x-tenant-secret\`. No requiere \`SERVICE_ROLE_SECRET\`.

**Flujo:**
1. Valida las credenciales del tenant (\`x-tenant-key\` y \`x-tenant-secret\`) en la tabla \`tenants\`
2. Verifica que el tenant tenga \`status = 'active'\`
3. Verifica si existe un token activo de Uber en la tabla \`uber_direct_tokens\`
4. Si no hay token activo, genera uno nuevo automáticamente usando OAuth 2.0
5. Guarda el token en la tabla \`uber_direct_tokens\`
6. Usa el token para crear la cotización en Uber Direct API
7. Retorna la cotización con todos los detalles

**Headers requeridos:**
- \`x-tenant-key\`: API Key pública del tenant (debe existir en la tabla \`tenants\`)
- \`x-tenant-secret\`: API Secret del tenant (debe coincidir con el \`api_secret\` en la base de datos)

**Campos del Request Body:**
- \`dropoff_address\` (obligatorio): Dirección de entrega en formato JSON string
- \`pickup_address\` (obligatorio): Dirección de recogida en formato JSON string
- \`pickup_latitude\` (obligatorio): Latitud de la ubicación de recogida (-90 a 90)
- \`pickup_longitude\` (obligatorio): Longitud de la ubicación de recogida (-180 a 180)
- \`dropoff_latitude\` (obligatorio): Latitud de la ubicación de entrega (-90 a 90)
- \`dropoff_longitude\` (obligatorio): Longitud de la ubicación de entrega (-180 a 180)
- \`pickup_ready_dt\` (opcional): Fecha y hora en que el pedido estará listo para recogida (ISO 8601). Si no se proporciona, se genera automáticamente.
- \`pickup_deadline_dt\` (opcional): Fecha y hora límite para completar la recogida (ISO 8601). Si no se proporciona, se genera automáticamente.
- \`dropoff_ready_dt\` (opcional): Fecha y hora en que el pedido estará listo para entrega (ISO 8601). Si no se proporciona, se genera automáticamente.
- \`dropoff_deadline_dt\` (opcional): Fecha y hora límite para completar la entrega (ISO 8601). Si no se proporciona, se genera automáticamente.
- \`pickup_phone_number\` (obligatorio): Número de teléfono de contacto para la recogida (formato internacional con +)
- \`dropoff_phone_number\` (obligatorio): Número de teléfono de contacto para la entrega (formato internacional con +)
- \`manifest_total_value\` (obligatorio): Valor total de los artículos en centavos (unidad más pequeña de la moneda)
- \`external_store_id\` (obligatorio): Identificador externo de la tienda

**Descripción de los Campos de la Respuesta:**
- \`kind\`: Tipo de respuesta, siempre "delivery_quote" para este endpoint
- \`id\`: Identificador único de la cotización (ej: "dqt_MTRWwBCKTY2dPW0acltKyg")
- \`created\`: Marca de tiempo ISO 8601 cuando se creó la cotización
- \`expires\`: Marca de tiempo ISO 8601 cuando expira la cotización (típicamente 15 minutos después de la creación)
- \`fee\`: Tarifa de entrega en la unidad más pequeña de la moneda (ej: centavos para USD, pesos para CLP). Ejemplo: 251500 CLP = $2515.00 CLP
- \`currency\`: Código de moneda en minúsculas (ej: "usd", "clp")
- \`currency_type\`: Código de moneda en mayúsculas (ej: "USD", "CLP")
- \`dropoff_eta\`: Tiempo estimado de llegada al destino en formato ISO 8601
- \`duration\`: Duración total estimada de la entrega en segundos (desde el pickup hasta la finalización del dropoff)
- \`pickup_duration\`: Duración estimada desde la solicitud hasta la finalización del pickup en segundos
- \`external_store_id\`: El identificador de tienda externa que se envió en la solicitud
- \`dropoff_deadline\`: El tiempo límite para el dropoff especificado en la solicitud (formato ISO 8601)

**Errores posibles:**
- \`400 Bad Request\`: Headers faltantes (\`x-tenant-key\` o \`x-tenant-secret\`) o datos del body inválidos
- \`401 Unauthorized\`: Tenant no encontrado, credenciales inválidas o tenant inactivo
- \`500 Internal Server Error\`: Error interno del servidor o error al comunicarse con Uber Direct API

**Notas importantes:**
- El token de Uber se reutiliza si está activo (no ha expirado)
- Los tokens se almacenan en la tabla \`uber_direct_tokens\` y se comparten entre todos los tenants
- Las direcciones deben ser strings JSON válidos, no objetos
- Las coordenadas GPS deben corresponder con las direcciones especificadas`
  })
  @ApiResponse({
    status: 200,
    description: 'Cotización creada exitosamente',
    schema: {
      type: 'object',
      properties: {
        kind: { type: 'string', example: 'delivery_quote' },
        id: { type: 'string', example: 'dqt_MTRWwBCKTY2dPW0acltKyg' },
        created: { type: 'string', format: 'date-time', example: '2025-11-02T09:20:27.622Z' },
        expires: { type: 'string', format: 'date-time', example: '2025-11-02T09:35:27.622Z' },
        fee: { type: 'number', example: 251500 },
        currency: { type: 'string', example: 'clp' },
        currency_type: { type: 'string', example: 'CLP' },
        dropoff_eta: { type: 'string', format: 'date-time' },
        duration: { type: 'number', example: 1800 },
        pickup_duration: { type: 'number', example: 600 },
        external_store_id: { type: 'string', example: 'store_12345' },
        dropoff_deadline: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad Request - Headers faltantes o datos inválidos',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Headers requeridos: x-tenant-key, x-tenant-secret' }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'No autorizado - Credenciales inválidas o tenant inactivo',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Tenant no encontrado o credenciales inválidas' }
      }
    }
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Error interno del servidor',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 500 },
        message: { type: 'string', example: 'Error interno del servidor' }
      }
    }
  })
  async createDeliveryQuote(
    @Body() dto: DeliveryQuoteInternalDto,
    @Headers('x-tenant-key') apiKey: string,
    @Headers('x-tenant-secret') apiSecret: string,
  ) {
    // Validar que los headers estén presentes
    if (!apiKey || !apiSecret) {
      throw new BadRequestException('Headers requeridos: x-tenant-key, x-tenant-secret');
    }

    this.logger.log(`Solicitud de cotización con API Key: ${apiKey.substring(0, 10)}...`);
    this.logger.debug(`API Key recibida: ${apiKey.substring(0, 10)}...`);
    this.logger.debug(`API Secret recibida: ${apiSecret.substring(0, 10)}...`);

    // 1. Validar tenant en la tabla tenants usando api_key y api_secret
    const tenant = await this.databaseService.queryOne<{
      id: string;
      api_key: string;
      api_secret: string;
      status: string;
    }>(
      `SELECT id, api_key, api_secret, status 
       FROM tenants 
       WHERE api_key = $1 AND api_secret = $2 AND status = 'active'`,
      [apiKey, apiSecret]
    );

    if (!tenant) {
      this.logger.warn(`Tenant no encontrado o credenciales inválidas para API Key: ${apiKey.substring(0, 10)}...`);
      throw new UnauthorizedException('Tenant no encontrado o credenciales inválidas');
    }

    this.logger.debug(`Tenant encontrado. ID: ${tenant.id}, Status: ${tenant.status}`);
    this.logger.log(`Tenant validado correctamente`);

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

    this.logger.log(`Cotización creada exitosamente para tenant ID: ${tenant.id}`);
    return quote;
  }
}

