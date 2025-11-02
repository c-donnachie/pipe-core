import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  Logger,
  HttpCode,
  HttpStatus,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
  ApiBearerAuth,
  ApiSecurity,
} from '@nestjs/swagger';
import { UberService } from './uber.service';
import { UberAuthService } from './uber-auth.service';
import { CreateDeliveryDto, GenerateTokenDto, TokenResponseDto, CreateQuoteDto, ListDeliveriesDto } from './dto/uber.dto';
import { UBER_CONSTANTS } from './constants';

@ApiTags('uber')
@Controller('uber')
export class UberController {
  private readonly logger = new Logger(UberController.name);

  constructor(
    private readonly uberService: UberService,
    private readonly uberAuthService: UberAuthService,
  ) {}

  @Post('customers/:customer_id/deliveries')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create a delivery',
    description:
      'Create a delivery between two addresses with comprehensive verification options. ' +
      'This endpoint replicates the Uber Direct API Create Delivery functionality. ' +
      'Supports manifest items, verification requirements, and advanced delivery options.',
  })
  @ApiHeader({
    name: 'x-uber-token',
    description:
      'Custom Uber Direct access token (optional). ' +
      'If not provided, the API will automatically obtain a token via OAuth.',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Delivery created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'del_abc123xyz' },
        status: { type: 'string', example: 'pending' },
        complete: { type: 'boolean', example: false },
        kind: { type: 'string', example: 'on_demand' },
        pickup: {
          type: 'object',
          properties: {
            address: { type: 'string', example: '456 Market St, San Francisco, CA 94103' },
            latitude: { type: 'number', example: 37.7749 },
            longitude: { type: 'number', example: -122.4194 },
            name: { type: 'string', example: 'Jane Smith' },
            phone_number: { type: 'string', example: '+14155555678' },
          },
        },
        dropoff: {
          type: 'object',
          properties: {
            address: { type: 'string', example: '123 Main St, San Francisco, CA 94102' },
            latitude: { type: 'number', example: 37.7849 },
            longitude: { type: 'number', example: -122.4094 },
            name: { type: 'string', example: 'John Doe' },
            phone_number: { type: 'string', example: '+14155551234' },
          },
        },
        manifest: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', example: 'Pizza Margherita' },
              quantity: { type: 'number', example: 2 },
              size: { type: 'string', example: 'medium' },
              price: { type: 'number', example: 1500 },
            },
          },
        },
        created: { type: 'string', example: '2025-01-15T10:30:00Z' },
        updated: { type: 'string', example: '2025-01-15T10:35:00Z' },
        pickup_eta: { type: 'string', example: '2025-01-15T10:45:00Z' },
        dropoff_eta: { type: 'string', example: '2025-01-15T11:15:00Z' },
        tracking_url: { type: 'string', example: 'https://track.uber.com/abc123' },
        courier: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'John Smith' },
            phone_number: { type: 'string', example: '+14155551234' },
            vehicle_type: { type: 'string', example: 'car' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input data or missing Customer ID',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or expired OAuth credentials',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async createDelivery(
    @Param('customer_id') customerId: string,
    @Body() createDeliveryDto: CreateDeliveryDto,
    @Headers('x-uber-token') customToken?: string,
  ) {
    this.logger.log(`Received create-delivery request for customer: ${customerId}`);
    this.logger.debug(
      `Custom token: ${customToken ? 'Yes' : 'No (using OAuth)'}`,
    );

    return await this.uberService.createDelivery(
      customerId,
      createDeliveryDto,
      customToken,
    );
  }

  @Post('generate-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate Uber OAuth 2.0 access token',
    description:
      'Generates a new OAuth 2.0 access token using client credentials grant type. ' +
      'This endpoint replicates the Uber OAuth token generation process shown in Postman. ' +
      'Uses form-data with client_id, client_secret, grant_type, and scope parameters.',
  })
  @ApiResponse({
    status: 200,
    description: 'Token generated successfully',
    type: TokenResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid parameters',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid client credentials',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async generateToken(@Body() generateTokenDto: GenerateTokenDto): Promise<TokenResponseDto> {
    this.logger.log('Received generate-token request');
    this.logger.debug(
      `Grant type: ${generateTokenDto.grant_type}, Scope: ${generateTokenDto.scope}`,
    );

    const tokenResponse = await this.uberAuthService.generateToken(
      generateTokenDto.grant_type,
      generateTokenDto.scope,
    );

    return tokenResponse;
  }

  @Post('customers/:customer_id/delivery_quotes')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Crear una cotización de entrega',
    description:
      'Crea una cotización para verificar la entregabilidad, validez y costo de entrega entre dos direcciones. ' +
      'Este endpoint replica la funcionalidad de Create Quote de la API de Uber Direct. ' +
      'La autenticación se maneja automáticamente mediante OAuth 2.0 usando las credenciales configuradas. ' +
      'Los campos de fecha son opcionales - si no se proporcionan, se generarán automáticamente siguiendo los requisitos de Uber.\n\n' +
      '**Descripción de los Campos de la Respuesta:**\n' +
      '- `kind`: Tipo de respuesta, siempre "delivery_quote" para este endpoint\n' +
      '- `id`: Identificador único de la cotización (ej: "dqt_MTRWwBCKTY2dPW0acltKyg")\n' +
      '- `created`: Marca de tiempo ISO 8601 cuando se creó la cotización\n' +
      '- `expires`: Marca de tiempo ISO 8601 cuando expira la cotización (típicamente 15 minutos después de la creación)\n' +
      '- `fee`: Tarifa de entrega en la unidad más pequeña de la moneda (ej: centavos para USD, pesos para CLP). Ejemplo: 251500 CLP = $2515.00 CLP\n' +
      '- `currency`: Código de moneda en minúsculas (ej: "usd", "clp")\n' +
      '- `currency_type`: Código de moneda en mayúsculas (ej: "USD", "CLP")\n' +
      '- `dropoff_eta`: Tiempo estimado de llegada al destino en formato ISO 8601\n' +
      '- `duration`: Duración total estimada de la entrega en segundos (desde el pickup hasta la finalización del dropoff)\n' +
      '- `pickup_duration`: Duración estimada desde la solicitud hasta la finalización del pickup en segundos\n' +
      '- `external_store_id`: El identificador de tienda externa que se envió en la solicitud\n' +
      '- `dropoff_deadline`: El tiempo límite para el dropoff especificado en la solicitud (formato ISO 8601)',
  })
  @ApiHeader({
    name: 'x-uber-token',
    description:
      'Token de acceso personalizado de Uber Direct (opcional). ' +
      'Si no se proporciona, la API obtendrá automáticamente un token mediante OAuth.',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Cotización creada exitosamente',
    schema: {
      type: 'object',
      properties: {
        kind: {
          type: 'string',
          example: 'delivery_quote',
          description: 'Tipo de respuesta, siempre "delivery_quote" para este endpoint',
        },
        id: {
          type: 'string',
          example: 'dqt_MTRWwBCKTY2dPW0acltKyg',
          description: 'Identificador único de la cotización',
        },
        created: {
          type: 'string',
          example: '2025-11-02T09:20:27.622Z',
          description: 'Marca de tiempo ISO 8601 cuando se creó la cotización',
        },
        expires: {
          type: 'string',
          example: '2025-11-02T09:35:27.622Z',
          description: 'Marca de tiempo ISO 8601 cuando expira la cotización (típicamente 15 minutos después de la creación)',
        },
        fee: {
          type: 'number',
          example: 251500,
          description: 'Tarifa de entrega en la unidad más pequeña de la moneda (ej: centavos para USD, pesos para CLP). Ejemplo: 251500 CLP = $2515.00 CLP',
        },
        currency: {
          type: 'string',
          example: 'clp',
          description: 'Código de moneda en minúsculas (ej: "usd", "clp")',
        },
        currency_type: {
          type: 'string',
          example: 'CLP',
          description: 'Código de moneda en mayúsculas (ej: "USD", "CLP")',
        },
        dropoff_eta: {
          type: 'string',
          example: '2025-11-02T15:55:00Z',
          description: 'Tiempo estimado de llegada al destino en formato ISO 8601',
        },
        duration: {
          type: 'number',
          example: 394,
          description: 'Duración total estimada de la entrega en segundos (desde el pickup hasta la finalización del dropoff)',
        },
        pickup_duration: {
          type: 'number',
          example: 369,
          description: 'Duración estimada desde la solicitud hasta la finalización del pickup en segundos',
        },
        external_store_id: {
          type: 'string',
          example: 'store_12345',
          description: 'El identificador de tienda externa que se envió en la solicitud',
        },
        dropoff_deadline: {
          type: 'string',
          example: '2025-11-02T16:15:00Z',
          description: 'El tiempo límite para el dropoff especificado en la solicitud (formato ISO 8601)',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Solicitud inválida - Datos de entrada inválidos o Customer ID faltante',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado - Credenciales OAuth inválidas o expiradas',
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
  })
  async createQuote(
    @Param('customer_id') customerId: string,
    @Body() createQuoteDto: CreateQuoteDto,
    @Headers('x-uber-token') customToken?: string,
  ) {
    this.logger.log(`Received create-quote request for customer: ${customerId}`);
    this.logger.debug(
      `Custom token: ${customToken ? 'Yes' : 'No (using OAuth)'}`,
    );

    return await this.uberService.createQuote(
      customerId,
      createQuoteDto,
      customToken,
    );
  }

  @Get('customers/:customer_id/deliveries')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List deliveries',
    description:
      'Retrieve a list of deliveries for a specific customer. ' +
      'This endpoint replicates the Uber Direct API List Deliveries functionality. ' +
      'Supports filtering by status, external store ID, and date ranges.',
  })
  @ApiHeader({
    name: 'x-uber-token',
    description:
      'Custom Uber Direct access token (optional). ' +
      'If not provided, the API will automatically obtain a token via OAuth.',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Deliveries listed successfully',
    schema: {
      type: 'object',
      properties: {
        deliveries: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'del_abc123xyz' },
              status: { type: 'string', example: 'pending' },
              complete: { type: 'boolean', example: false },
              kind: { type: 'string', example: 'on_demand' },
              pickup: {
                type: 'object',
                properties: {
                  address: { type: 'string', example: '456 Market St, San Francisco, CA 94103' },
                  latitude: { type: 'number', example: 37.7749 },
                  longitude: { type: 'number', example: -122.4194 },
                },
              },
              dropoff: {
                type: 'object',
                properties: {
                  address: { type: 'string', example: '123 Main St, San Francisco, CA 94102' },
                  latitude: { type: 'number', example: 37.7849 },
                  longitude: { type: 'number', example: -122.4094 },
                },
              },
              created: { type: 'string', example: '2025-01-15T10:30:00Z' },
              updated: { type: 'string', example: '2025-01-15T10:35:00Z' },
              tracking_url: { type: 'string', example: 'https://track.uber.com/abc123' },
            },
          },
        },
        limit: { type: 'number', example: 50 },
        offset: { type: 'number', example: 0 },
        total: { type: 'number', example: 150 },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid query parameters or missing Customer ID',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or expired OAuth credentials',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async listDeliveries(
    @Param('customer_id') customerId: string,
    @Query() listDeliveriesDto: ListDeliveriesDto,
    @Headers('x-uber-token') customToken?: string,
  ) {
    this.logger.log(`Received list-deliveries request for customer: ${customerId}`);
    this.logger.debug(
      `Query params: ${JSON.stringify(listDeliveriesDto)}, ` +
      `Custom token: ${customToken ? 'Yes' : 'No (using OAuth)'}`,
    );

    return await this.uberService.listDeliveries(
      customerId,
      listDeliveriesDto,
      customToken,
    );
  }

  @Post('debug/config')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Debug configuration and token',
    description: 'Debug endpoint to verify configuration and token status',
  })
  async debugConfig(@Headers('x-uber-token') customToken?: string) {
    this.logger.log('Debug configuration request received');
    
    const config = {
      hasCustomToken: !!customToken,
      tokenLength: customToken ? customToken.length : 0,
      tokenPreview: customToken ? `${customToken.substring(0, 20)}...${customToken.substring(customToken.length - 10)}` : 'No token',
      envConfig: {
        hasClientId: !!process.env.UBER_DIRECT_CLIENT_ID,
        hasClientSecret: !!process.env.UBER_DIRECT_CLIENT_SECRET,
        hasCustomerId: !!process.env.UBER_DIRECT_CUSTOMER_ID,
        authUrl: process.env.UBER_AUTH_URL || 'https://login.uber.com/oauth/v2/token',
        baseUrl: process.env.UBER_BASE_URL || 'https://api.uber.com/v1',
      },
    };

    this.logger.debug(`Debug config: ${JSON.stringify(config, null, 2)}`);
    
    return config;
  }

  @Post('test/connection')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Test Uber API connection',
    description: 'Test endpoint to verify connection and authentication with Uber API',
  })
  async testConnection(@Headers('x-uber-token') customToken?: string) {
    this.logger.log('Test connection request received');
    
    return await this.uberService.testConnection(customToken);
  }

}
