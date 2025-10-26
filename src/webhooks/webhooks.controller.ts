import { 
  Controller, 
  Post, 
  Get, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  Logger, 
  HttpCode, 
  HttpStatus 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import { 
  WebhookConfig, 
  WebhookLog, 
  WebhookStats,
  CreateWebhookEventDto 
} from './interfaces';

@ApiTags('Webhooks Management')
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('events')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crea y procesa un evento de webhook' })
  @ApiResponse({ 
    status: 201, 
    description: 'Evento procesado exitosamente',
    schema: { type: 'object', properties: { success: { type: 'boolean' } } }
  })
  @ApiResponse({ status: 400, description: 'Datos del evento inválidos' })
  @ApiBody({ type: CreateWebhookEventDto })
  async createEvent(@Body() createEventDto: CreateWebhookEventDto): Promise<{ success: boolean }> {
    this.logger.log(`Procesando evento: ${createEventDto.eventType} para tenant: ${createEventDto.tenantId}`);
    await this.webhooksService.processEvent(createEventDto);
    return { success: true };
  }

  @Post('incoming/:provider')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Procesa webhook entrante de proveedor externo' })
  @ApiParam({ name: 'provider', description: 'Proveedor externo (mercadopago, transbank, stripe, etc.)' })
  @ApiQuery({ name: 'event_type', description: 'Tipo de evento' })
  @ApiQuery({ name: 'tenant_id', required: false, description: 'ID del tenant' })
  @ApiResponse({ 
    status: 200, 
    description: 'Webhook procesado exitosamente',
    schema: { type: 'object', properties: { success: { type: 'boolean' } } }
  })
  @ApiResponse({ status: 400, description: 'Webhook inválido' })
  async processIncomingWebhook(
    @Param('provider') provider: string,
    @Query('event_type') eventType: string,
    @Query('tenant_id') tenantId?: string,
    @Body() payload: any = {}
  ): Promise<{ success: boolean }> {
    this.logger.log(`Procesando webhook entrante de ${provider}: ${eventType}`);
    await this.webhooksService.processIncomingWebhook(provider, eventType, payload, undefined, tenantId);
    return { success: true };
  }

  @Post('configure')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Configura un webhook para un tenant' })
  @ApiResponse({ 
    status: 200, 
    description: 'Webhook configurado exitosamente',
    schema: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' } } }
  })
  @ApiResponse({ status: 400, description: 'Configuración inválida' })
  @ApiBody({ 
    schema: { 
      type: 'object', 
      properties: { 
        tenantId: { type: 'string', description: 'ID del tenant' },
        eventType: { type: 'string', description: 'Tipo de evento' },
        webhookUrl: { type: 'string', description: 'URL del webhook' },
        secret: { type: 'string', description: 'Secreto para firmar webhooks' },
        retryAttempts: { type: 'number', description: 'Número de intentos de reintento' },
        timeout: { type: 'number', description: 'Timeout en milisegundos' },
        isActive: { type: 'boolean', description: 'Si el webhook está activo' }
      }
    }
  })
  async configureWebhook(
    @Body() body: {
      tenantId: string;
      eventType: string;
      webhookUrl: string;
      secret: string;
      retryAttempts?: number;
      timeout?: number;
      isActive?: boolean;
    }
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Configurando webhook para tenant: ${body.tenantId}, evento: ${body.eventType}`);
    await this.webhooksService.configureWebhook(
      body.tenantId,
      body.eventType,
      body.webhookUrl,
      body.secret,
      {
        retryAttempts: body.retryAttempts,
        timeout: body.timeout,
        isActive: body.isActive,
      }
    );
    return {
      success: true,
      message: `Webhook configurado exitosamente para tenant ${body.tenantId}`
    };
  }

  @Get('configs')
  @ApiOperation({ summary: 'Obtiene configuraciones de webhooks de un tenant' })
  @ApiQuery({ name: 'tenant_id', description: 'ID del tenant' })
  @ApiQuery({ name: 'event_type', required: false, description: 'Filtrar por tipo de evento' })
  @ApiResponse({ 
    status: 200, 
    description: 'Configuraciones obtenidas exitosamente',
    type: [Object] 
  })
  async getWebhookConfigs(
    @Query('tenant_id') tenantId: string,
    @Query('event_type') eventType?: string
  ): Promise<WebhookConfig[]> {
    this.logger.log(`Obteniendo configuraciones de webhooks para tenant: ${tenantId}`);
    return await this.webhooksService.getWebhookConfigs(tenantId, eventType);
  }

  @Put(':eventType/activate')
  @ApiOperation({ summary: 'Activa un webhook' })
  @ApiParam({ name: 'eventType', description: 'Tipo de evento' })
  @ApiQuery({ name: 'tenant_id', description: 'ID del tenant' })
  @ApiResponse({ 
    status: 200, 
    description: 'Webhook activado exitosamente',
    schema: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' } } }
  })
  async activateWebhook(
    @Param('eventType') eventType: string,
    @Query('tenant_id') tenantId: string
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Activando webhook para tenant: ${tenantId}, evento: ${eventType}`);
    await this.webhooksService.activateWebhook(tenantId, eventType);
    return {
      success: true,
      message: `Webhook activado exitosamente para tenant ${tenantId}`
    };
  }

  @Put(':eventType/deactivate')
  @ApiOperation({ summary: 'Desactiva un webhook' })
  @ApiParam({ name: 'eventType', description: 'Tipo de evento' })
  @ApiQuery({ name: 'tenant_id', description: 'ID del tenant' })
  @ApiResponse({ 
    status: 200, 
    description: 'Webhook desactivado exitosamente',
    schema: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' } } }
  })
  async deactivateWebhook(
    @Param('eventType') eventType: string,
    @Query('tenant_id') tenantId: string
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Desactivando webhook para tenant: ${tenantId}, evento: ${eventType}`);
    await this.webhooksService.deactivateWebhook(tenantId, eventType);
    return {
      success: true,
      message: `Webhook desactivado exitosamente para tenant ${tenantId}`
    };
  }

  @Delete(':eventType')
  @ApiOperation({ summary: 'Elimina un webhook' })
  @ApiParam({ name: 'eventType', description: 'Tipo de evento' })
  @ApiQuery({ name: 'tenant_id', description: 'ID del tenant' })
  @ApiResponse({ 
    status: 200, 
    description: 'Webhook eliminado exitosamente',
    schema: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' } } }
  })
  async removeWebhook(
    @Param('eventType') eventType: string,
    @Query('tenant_id') tenantId: string
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Eliminando webhook para tenant: ${tenantId}, evento: ${eventType}`);
    await this.webhooksService.removeWebhook(tenantId, eventType);
    return {
      success: true,
      message: `Webhook eliminado exitosamente para tenant ${tenantId}`
    };
  }

  @Get('logs')
  @ApiOperation({ summary: 'Obtiene logs de webhooks de un tenant' })
  @ApiQuery({ name: 'tenant_id', description: 'ID del tenant' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Número máximo de logs a retornar' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Número de logs a omitir' })
  @ApiQuery({ name: 'event_type', required: false, type: String, description: 'Filtrar por tipo de evento' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Filtrar por estado' })
  @ApiResponse({ 
    status: 200, 
    description: 'Logs obtenidos exitosamente',
    type: [Object] 
  })
  async getWebhookLogs(
    @Query('tenant_id') tenantId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('event_type') eventType?: string,
    @Query('status') status?: string
  ): Promise<WebhookLog[]> {
    this.logger.log(`Obteniendo logs de webhooks para tenant: ${tenantId}`);
    return await this.webhooksService.getWebhookLogs(tenantId, limit || 50, offset || 0, eventType, status);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obtiene estadísticas de webhooks de un tenant' })
  @ApiQuery({ name: 'tenant_id', description: 'ID del tenant' })
  @ApiQuery({ name: 'period', required: false, enum: ['day', 'week', 'month'], description: 'Período de estadísticas' })
  @ApiResponse({ 
    status: 200, 
    description: 'Estadísticas obtenidas exitosamente',
    type: Object 
  })
  async getWebhookStats(
    @Query('tenant_id') tenantId: string,
    @Query('period') period?: 'day' | 'week' | 'month'
  ): Promise<WebhookStats> {
    this.logger.log(`Obteniendo estadísticas de webhooks para tenant: ${tenantId}`);
    return await this.webhooksService.getWebhookStats(tenantId, period);
  }

  @Get('retry-queue')
  @ApiOperation({ summary: 'Obtiene eventos en cola de reintento' })
  @ApiQuery({ name: 'tenant_id', description: 'ID del tenant' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Número máximo de eventos a retornar' })
  @ApiResponse({ 
    status: 200, 
    description: 'Cola de reintentos obtenida exitosamente',
    type: [Object] 
  })
  async getRetryQueue(
    @Query('tenant_id') tenantId: string,
    @Query('limit') limit?: number
  ): Promise<any[]> {
    this.logger.log(`Obteniendo cola de reintentos para tenant: ${tenantId}`);
    return await this.webhooksService.getRetryQueue(tenantId, limit || 50);
  }

  @Post('retry-failed')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reprocesa eventos fallidos' })
  @ApiQuery({ name: 'tenant_id', description: 'ID del tenant' })
  @ApiQuery({ name: 'event_type', required: false, description: 'Tipo de evento específico' })
  @ApiResponse({ 
    status: 200, 
    description: 'Eventos reprocesados exitosamente',
    schema: { type: 'object', properties: { success: { type: 'boolean' }, count: { type: 'number' } } }
  })
  async reprocessFailedEvents(
    @Query('tenant_id') tenantId: string,
    @Query('event_type') eventType?: string
  ): Promise<{ success: boolean; count: number }> {
    this.logger.log(`Reprocesando eventos fallidos para tenant: ${tenantId}`);
    const count = await this.webhooksService.reprocessFailedEvents(tenantId, eventType);
    return { success: true, count };
  }

  @Post('test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Prueba un webhook' })
  @ApiResponse({ 
    status: 200, 
    description: 'Webhook probado exitosamente',
    type: Object 
  })
  @ApiResponse({ status: 400, description: 'Error probando webhook' })
  @ApiBody({ 
    schema: { 
      type: 'object', 
      properties: { 
        tenantId: { type: 'string', description: 'ID del tenant' },
        eventType: { type: 'string', description: 'Tipo de evento' },
        webhookUrl: { type: 'string', description: 'URL del webhook' },
        secret: { type: 'string', description: 'Secreto para firmar webhooks' }
      }
    }
  })
  async testWebhook(
    @Body() body: {
      tenantId: string;
      eventType: string;
      webhookUrl: string;
      secret: string;
    }
  ): Promise<{ success: boolean; responseTime: number; status: number; message?: string }> {
    this.logger.log(`Probando webhook: ${body.webhookUrl}`);
    return await this.webhooksService.testWebhook(body.tenantId, body.eventType, body.webhookUrl, body.secret);
  }

  @Get('event-types')
  @ApiOperation({ summary: 'Obtiene tipos de eventos soportados' })
  @ApiResponse({ 
    status: 200, 
    description: 'Tipos de eventos obtenidos exitosamente',
    schema: { 
      type: 'object', 
      properties: { 
        eventTypes: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'Lista de tipos de eventos soportados'
        }
      }
    }
  })
  async getSupportedEventTypes(): Promise<{ eventTypes: string[] }> {
    this.logger.log('Obteniendo tipos de eventos soportados');
    return {
      eventTypes: this.webhooksService.getSupportedEventTypes()
    };
  }

  @Get('health/check')
  @ApiOperation({ summary: 'Health check del servicio de webhooks' })
  @ApiResponse({ 
    status: 200, 
    description: 'Estado del servicio obtenido exitosamente',
    type: Object 
  })
  async healthCheck(): Promise<{ status: string; timestamp: string; eventTypes: number }> {
    this.logger.log('Realizando health check del servicio de webhooks');
    return await this.webhooksService.healthCheck();
  }
}
