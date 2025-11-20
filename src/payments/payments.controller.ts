import { 
  Controller, 
  Post, 
  Get, 
  Put, 
  Body, 
  Param, 
  Query, 
  Logger, 
  HttpCode, 
  HttpStatus 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { 
  CreatePaymentDto, 
  PaymentResponse, 
  PaymentStatus, 
  PaymentLog,
  PaymentStats 
} from './interfaces';

@ApiTags('Payments Management')
@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crea un nuevo pago' })
  @ApiResponse({ 
    status: 201, 
    description: 'Pago creado exitosamente',
    type: Object 
  })
  @ApiResponse({ status: 400, description: 'Datos de pago inválidos' })
  @ApiBody({ type: CreatePaymentDto })
  async createPayment(@Body() createPaymentDto: CreatePaymentDto): Promise<PaymentResponse> {
    this.logger.log(`Creando pago para tenant: ${createPaymentDto.tenantId}`);
    return await this.paymentsService.createPayment(createPaymentDto);
  }

  @Get(':paymentId/status')
  @ApiOperation({ summary: 'Obtiene el estado de un pago' })
  @ApiParam({ name: 'paymentId', description: 'ID del pago' })
  @ApiQuery({ name: 'tenant_id', description: 'ID del tenant' })
  @ApiResponse({ 
    status: 200, 
    description: 'Estado del pago obtenido exitosamente',
    type: Object 
  })
  @ApiResponse({ status: 404, description: 'Pago no encontrado' })
  async getPaymentStatus(
    @Param('paymentId') paymentId: string,
    @Query('tenant_id') tenantId: string
  ): Promise<PaymentStatus> {
    this.logger.log(`Obteniendo estado de pago: ${paymentId}`);
    return await this.paymentsService.getPaymentStatus(tenantId, paymentId);
  }

  @Post('webhook/:provider')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Procesa webhook de pago' })
  @ApiParam({ name: 'provider', description: 'Proveedor de pagos (mercadopago, transbank, stripe)' })
  @ApiQuery({ name: 'tenant_id', description: 'ID del tenant' })
  @ApiResponse({ 
    status: 200, 
    description: 'Webhook procesado exitosamente',
    schema: { type: 'object', properties: { success: { type: 'boolean' } } }
  })
  @ApiResponse({ status: 400, description: 'Webhook inválido' })
  async processWebhook(
    @Param('provider') provider: string,
    @Query('tenant_id') tenantId: string,
    @Body() webhookPayload: any
  ): Promise<{ success: boolean }> {
    this.logger.log(`Procesando webhook de ${provider} para tenant: ${tenantId}`);
    await this.paymentsService.processWebhook(tenantId, provider, webhookPayload);
    return { success: true };
  }

  @Put(':paymentId/cancel')
  @ApiOperation({ summary: 'Cancela un pago' })
  @ApiParam({ name: 'paymentId', description: 'ID del pago' })
  @ApiQuery({ name: 'tenant_id', description: 'ID del tenant' })
  @ApiResponse({ 
    status: 200, 
    description: 'Pago cancelado exitosamente',
    type: Object 
  })
  @ApiResponse({ status: 404, description: 'Pago no encontrado' })
  @ApiResponse({ status: 400, description: 'No se puede cancelar el pago' })
  async cancelPayment(
    @Param('paymentId') paymentId: string,
    @Query('tenant_id') tenantId: string,
    @Body() body: { reason?: string }
  ): Promise<PaymentResponse> {
    this.logger.log(`Cancelando pago: ${paymentId}`);
    return await this.paymentsService.cancelPayment(tenantId, paymentId, body.reason);
  }

  @Post(':paymentId/refund')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Reembolsa un pago' })
  @ApiParam({ name: 'paymentId', description: 'ID del pago' })
  @ApiQuery({ name: 'tenant_id', description: 'ID del tenant' })
  @ApiResponse({ 
    status: 201, 
    description: 'Reembolso iniciado exitosamente',
    type: Object 
  })
  @ApiResponse({ status: 404, description: 'Pago no encontrado' })
  @ApiResponse({ status: 400, description: 'No se puede reembolsar el pago' })
  @ApiBody({ 
    schema: { 
      type: 'object', 
      properties: { 
        amount: { type: 'number', description: 'Monto a reembolsar (opcional)' },
        reason: { type: 'string', description: 'Motivo del reembolso' }
      }
    }
  })
  async refundPayment(
    @Param('paymentId') paymentId: string,
    @Query('tenant_id') tenantId: string,
    @Body() body: { amount?: number; reason?: string }
  ): Promise<PaymentResponse> {
    this.logger.log(`Reembolsando pago: ${paymentId}`);
    return await this.paymentsService.refundPayment(tenantId, paymentId, body.amount, body.reason);
  }

  @Get('logs')
  @ApiOperation({ summary: 'Obtiene logs de pagos de un tenant' })
  @ApiQuery({ name: 'tenant_id', description: 'ID del tenant' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Número máximo de logs a retornar' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Número de logs a omitir' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Filtrar por estado' })
  @ApiQuery({ name: 'provider', required: false, type: String, description: 'Filtrar por proveedor' })
  @ApiResponse({ 
    status: 200, 
    description: 'Logs de pagos obtenidos exitosamente',
    type: [Object] 
  })
  async getPaymentLogs(
    @Query('tenant_id') tenantId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('status') status?: string,
    @Query('provider') provider?: string
  ): Promise<PaymentLog[]> {
    this.logger.log(`Obteniendo logs de pagos para tenant: ${tenantId}`);
    return await this.paymentsService.getPaymentLogs(tenantId, limit || 50, offset || 0, status, provider);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obtiene estadísticas de pagos de un tenant' })
  @ApiQuery({ name: 'tenant_id', description: 'ID del tenant' })
  @ApiQuery({ name: 'period', required: false, enum: ['day', 'week', 'month'], description: 'Período de estadísticas' })
  @ApiResponse({ 
    status: 200, 
    description: 'Estadísticas obtenidas exitosamente',
    type: Object 
  })
  async getPaymentStats(
    @Query('tenant_id') tenantId: string,
    @Query('period') period?: 'day' | 'week' | 'month'
  ): Promise<PaymentStats> {
    this.logger.log(`Obteniendo estadísticas de pagos para tenant: ${tenantId}`);
    return await this.paymentsService.getPaymentStats(tenantId, period);
  }

  @Post('configure')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Configura un proveedor de pagos para un tenant' })
  @ApiResponse({ 
    status: 200, 
    description: 'Proveedor configurado exitosamente',
    schema: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' } } }
  })
  @ApiResponse({ status: 400, description: 'Credenciales inválidas' })
  @ApiBody({ 
    schema: { 
      type: 'object', 
      properties: { 
        tenantId: { type: 'string', description: 'ID del tenant' },
        provider: { type: 'string', enum: ['mercadopago', 'transbank', 'stripe'], description: 'Proveedor de pagos' },
        credentials: { type: 'object', description: 'Credenciales del proveedor' }
      }
    }
  })
  async configurePaymentProvider(
    @Body() body: {
      tenantId: string;
      provider: 'mercadopago' | 'transbank' | 'stripe';
      credentials: Record<string, any>;
    }
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Configurando proveedor ${body.provider} para tenant: ${body.tenantId}`);
    await this.paymentsService.configurePaymentProvider(body.tenantId, body.provider, body.credentials);
    return {
      success: true,
      message: `Proveedor ${body.provider} configurado exitosamente para tenant ${body.tenantId}`
    };
  }

  @Get('health/check')
  @ApiOperation({ summary: 'Health check del servicio de pagos' })
  @ApiResponse({ 
    status: 200, 
    description: 'Estado del servicio obtenido exitosamente',
    type: Object 
  })
  async healthCheck(): Promise<{ status: string; timestamp: string; providers: number }> {
    this.logger.log('Realizando health check del servicio de pagos');
    return await this.paymentsService.healthCheck();
  }

  @Get('providers')
  @ApiOperation({ summary: 'Obtiene los proveedores de pagos disponibles' })
  @ApiResponse({ 
    status: 200, 
    description: 'Proveedores obtenidos exitosamente',
    schema: { 
      type: 'object', 
      properties: { 
        providers: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'Lista de proveedores disponibles'
        }
      }
    }
  })
  async getAvailableProviders(): Promise<{ providers: string[] }> {
    this.logger.log('Obteniendo proveedores de pagos disponibles');
    return {
      providers: ['mercadopago', 'transbank', 'stripe']
    };
  }
}
