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

  @Post('create-delivery')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create a new Uber Direct delivery',
    description:
      'Creates a new delivery request with Uber Direct. ' +
      'Authentication is handled automatically via OAuth 2.0 using configured credentials. ' +
      'Optionally, you can provide a custom access token and customer ID via headers.',
  })
  @ApiHeader({
    name: 'x-uber-token',
    description:
      'Custom Uber Direct access token (optional). ' +
      'If not provided, the API will automatically obtain a token via OAuth.',
    required: false,
  })
  @ApiHeader({
    name: 'x-uber-customer-id',
    description:
      'Custom Uber Direct Customer ID (optional). ' +
      'If not provided, uses UBER_DIRECT_CUSTOMER_ID from environment variables.',
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
        tracking_url: {
          type: 'string',
          example: 'https://track.uber.com/abc123',
        },
        pickup_eta: { type: 'string', example: '2024-01-15T10:30:00Z' },
        dropoff_eta: { type: 'string', example: '2024-01-15T11:00:00Z' },
        complete: { type: 'boolean', example: false },
        kind: { type: 'string', example: 'on_demand' },
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
    @Body() createDeliveryDto: CreateDeliveryDto,
    @Headers('x-uber-token') customToken?: string,
    @Headers('x-uber-customer-id') customCustomerId?: string,
  ) {
    this.logger.log('Received create-delivery request');
    this.logger.debug(
      `Custom token: ${customToken ? 'Yes' : 'No (using OAuth)'}, ` +
      `Custom customer ID: ${customCustomerId ? 'Yes' : 'No (using default)'}`,
    );

    return await this.uberService.createDelivery(
      createDeliveryDto,
      customToken,
      customCustomerId,
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
    summary: 'Create a delivery quote',
    description:
      'Create a quote to check deliverability, validity and cost for delivery between two addresses. ' +
      'This endpoint replicates the Uber Direct API Create Quote functionality. ' +
      'Authentication is handled automatically via OAuth 2.0 using configured credentials. ' +
      'Date fields are optional - if not provided, they will be generated automatically following Uber requirements.',
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
    description: 'Quote created successfully',
    schema: {
      type: 'object',
      properties: {
        quote_id: { type: 'string', example: 'quote_abc123xyz' },
        fee: { type: 'number', example: 850 },
        currency: { type: 'string', example: 'USD' },
        currency_type: { type: 'string', example: 'USD' },
        pickup_eta: { type: 'string', example: '2024-01-15T10:30:00Z' },
        dropoff_eta: { type: 'string', example: '2024-01-15T11:00:00Z' },
        deliverable: { type: 'boolean', example: true },
        reason: { type: 'string', example: 'Delivery available' },
        expires_at: { type: 'string', example: '2024-01-15T12:00:00Z' },
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
