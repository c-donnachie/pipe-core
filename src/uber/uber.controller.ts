import {
  Controller,
  Post,
  Body,
  Headers,
  Logger,
  HttpCode,
  HttpStatus,
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
import { CreateDeliveryDto, GenerateTokenDto, TokenResponseDto } from './dto/uber.dto';
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
}
