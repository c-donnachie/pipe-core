import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  Query, 
  Logger, 
  HttpCode, 
  HttpStatus 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { MessagingService } from './messaging.service';
import { MessageResponse, MessageLog, MessagingStats } from './interfaces';

@ApiTags('Messaging Orchestrator')
@Controller('messaging')
export class MessagingController {
  private readonly logger = new Logger(MessagingController.name);

  constructor(private readonly messagingService: MessagingService) {}

  @Post('send/:channel')
  @ApiOperation({ summary: 'Envía un mensaje por canal específico' })
  @ApiParam({ name: 'channel', description: 'Canal de mensajería', enum: ['sms', 'whatsapp', 'email'] })
  @ApiResponse({ 
    status: 200, 
    description: 'Mensaje enviado exitosamente',
    type: Object 
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  async sendMessage(
    @Param('channel') channel: 'sms' | 'whatsapp' | 'email',
    @Body() body: any
  ): Promise<MessageResponse> {
    this.logger.log(`Enviando mensaje ${channel} para tenant ${body.tenantId}`);

    switch (channel) {
      case 'sms':
        return this.messagingService.sendSms(body.tenantId, body.to, body.body);
      case 'whatsapp':
        return this.messagingService.sendWhatsapp(body.tenantId, body.to, body.body, body.mediaUrls);
      case 'email':
        return this.messagingService.sendEmail(
          body.tenantId,
          body.to,
          body.subject,
          body.htmlContent,
          body.textContent,
          body.from,
          body.attachments
        );
      default:
        throw new Error(`Canal no soportado: ${channel}`);
    }
  }

  @Post('webhook/:channel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook para recibir eventos de cualquier canal' })
  @ApiParam({ name: 'channel', description: 'Canal de mensajería', enum: ['sms', 'whatsapp', 'email'] })
  @ApiResponse({ status: 200, description: 'Webhook procesado exitosamente' })
  async handleWebhook(
    @Param('channel') channel: 'sms' | 'whatsapp' | 'email',
    @Body() webhookData: any,
    @Query('tenant_id') tenantId?: string,
    @Query('provider') provider?: string
  ): Promise<{ success: boolean }> {
    this.logger.log(`Procesando webhook ${channel}`);
    
    await this.messagingService.processWebhook(
      channel, 
      webhookData, 
      tenantId || 'default', 
      provider || 'twilio'
    );
    
    return { success: true };
  }

  @Get('logs/:tenantId/:channel')
  @ApiOperation({ summary: 'Obtiene logs de mensajería por tenant y canal' })
  @ApiParam({ name: 'tenantId', description: 'ID del tenant' })
  @ApiParam({ name: 'channel', description: 'Canal de mensajería', enum: ['sms', 'whatsapp', 'email'] })
  @ApiQuery({ name: 'limit', required: false, description: 'Límite de resultados (default: 50)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Logs obtenidos exitosamente',
    type: [Object] 
  })
  async getLogsByChannel(
    @Param('tenantId') tenantId: string,
    @Param('channel') channel: 'sms' | 'whatsapp' | 'email',
    @Query('limit') limit?: string
  ): Promise<MessageLog[]> {
    const limitNumber = limit ? parseInt(limit, 10) : 50;
    this.logger.log(`Obteniendo logs ${channel} para tenant ${tenantId} (límite: ${limitNumber})`);
    
    return this.messagingService.getLogs(tenantId, channel, limitNumber);
  }

  @Get('logs/:tenantId')
  @ApiOperation({ summary: 'Obtiene logs de todos los canales por tenant' })
  @ApiParam({ name: 'tenantId', description: 'ID del tenant' })
  @ApiQuery({ name: 'limit', required: false, description: 'Límite de resultados (default: 50)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Logs de todos los canales obtenidos exitosamente',
    type: [Object] 
  })
  async getAllLogs(
    @Param('tenantId') tenantId: string,
    @Query('limit') limit?: string
  ): Promise<MessageLog[]> {
    const limitNumber = limit ? parseInt(limit, 10) : 50;
    this.logger.log(`Obteniendo logs de todos los canales para tenant ${tenantId} (límite: ${limitNumber})`);
    
    return this.messagingService.getAllLogs(tenantId, limitNumber);
  }

  @Get('stats/:tenantId')
  @ApiOperation({ summary: 'Obtiene estadísticas de mensajería por tenant' })
  @ApiParam({ name: 'tenantId', description: 'ID del tenant' })
  @ApiResponse({ 
    status: 200, 
    description: 'Estadísticas obtenidas exitosamente',
    type: Object 
  })
  async getMessagingStats(@Param('tenantId') tenantId: string): Promise<MessagingStats> {
    this.logger.log(`Obteniendo estadísticas de mensajería para tenant ${tenantId}`);
    
    return this.messagingService.getMessagingStats(tenantId);
  }

  @Post('test/:channel')
  @ApiOperation({ summary: 'Envía un mensaje de prueba por canal' })
  @ApiParam({ name: 'channel', description: 'Canal de mensajería', enum: ['sms', 'whatsapp', 'email'] })
  @ApiResponse({ 
    status: 200, 
    description: 'Mensaje de prueba enviado exitosamente',
    type: Object 
  })
  async sendTestMessage(
    @Param('channel') channel: 'sms' | 'whatsapp' | 'email',
    @Body() body: {
      tenantId: string;
      to: string;
    }
  ): Promise<MessageResponse> {
    this.logger.log(`Enviando mensaje de prueba ${channel} para tenant ${body.tenantId}`);
    
    return this.messagingService.sendTestMessage(channel, body.tenantId, body.to);
  }

  @Get('health')
  @ApiOperation({ summary: 'Verifica el estado de todos los servicios de mensajería' })
  @ApiResponse({ 
    status: 200, 
    description: 'Estado de todos los servicios',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'healthy' },
        services: {
          type: 'object',
          properties: {
            sms: { type: 'object' },
            whatsapp: { type: 'object' },
            email: { type: 'object' }
          }
        },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' }
      }
    }
  })
  async healthCheck(): Promise<any> {
    return this.messagingService.healthCheck();
  }

  @Get('channels')
  @ApiOperation({ summary: 'Obtiene información sobre los canales disponibles' })
  @ApiResponse({ 
    status: 200, 
    description: 'Información de canales obtenida exitosamente',
    schema: {
      type: 'object',
      properties: {
        channels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              displayName: { type: 'string' },
              description: { type: 'string' },
              supportedFeatures: { type: 'array', items: { type: 'string' } },
              providers: { type: 'array', items: { type: 'string' } }
            }
          }
        }
      }
    }
  })
  async getAvailableChannels(): Promise<any> {
    return {
      channels: [
        {
          name: 'sms',
          displayName: 'SMS',
          description: 'Envío de mensajes de texto cortos',
          supportedFeatures: ['text', 'media', 'webhooks'],
          providers: ['twilio'],
          limits: {
            maxLength: 1600,
            maxMediaFiles: 10
          }
        },
        {
          name: 'whatsapp',
          displayName: 'WhatsApp',
          description: 'Envío de mensajes WhatsApp con soporte para medios',
          supportedFeatures: ['text', 'media', 'templates', 'webhooks', 'auto-reply'],
          providers: ['twilio', 'meta'],
          limits: {
            maxLength: 4096,
            maxMediaFiles: 10
          }
        },
        {
          name: 'email',
          displayName: 'Email',
          description: 'Envío de correos electrónicos con HTML y adjuntos',
          supportedFeatures: ['html', 'text', 'attachments', 'templates', 'webhooks'],
          providers: ['resend', 'sendgrid'],
          limits: {
            maxSubjectLength: 78,
            maxBodyLength: 1000000,
            maxAttachments: 10
          }
        }
      ]
    };
  }

  @Post('config/provider')
  @ApiOperation({ summary: 'Configura un proveedor específico para un tenant' })
  @ApiResponse({ 
    status: 200, 
    description: 'Proveedor configurado exitosamente',
    type: Object 
  })
  async configureProvider(
    @Body() body: {
      tenantId: string;
      channel: 'sms' | 'whatsapp' | 'email';
      provider: 'twilio' | 'meta' | 'sendgrid' | 'resend';
      credentials: Record<string, any>;
      isActive?: boolean;
    }
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Configurando proveedor ${body.provider} para tenant ${body.tenantId} en canal ${body.channel}`);
    
    // Aquí se integraría con el MessageRouter para configurar el proveedor
    // await this.messagingService.configureProvider(body.tenantId, body.channel, body.provider, body.credentials);
    
    return {
      success: true,
      message: `Proveedor ${body.provider} configurado exitosamente para tenant ${body.tenantId} en canal ${body.channel}`
    };
  }

  @Get('config/:tenantId')
  @ApiOperation({ summary: 'Obtiene la configuración de proveedores para un tenant' })
  @ApiParam({ name: 'tenantId', description: 'ID del tenant' })
  @ApiResponse({ 
    status: 200, 
    description: 'Configuración obtenida exitosamente',
    type: Object 
  })
  async getTenantConfig(@Param('tenantId') tenantId: string): Promise<any> {
    this.logger.log(`Obteniendo configuración para tenant ${tenantId}`);
    
    // Aquí se integraría con el MessageRouter para obtener la configuración
    // const config = await this.messagingService.getTenantConfig(tenantId);
    
    return {
      tenantId,
      channels: {
        sms: { provider: 'twilio', isActive: true },
        whatsapp: { provider: 'twilio', isActive: true },
        email: { provider: 'resend', isActive: true }
      }
    };
  }
}
