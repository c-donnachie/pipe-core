import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from '../auth/auth.service';
import { RegisterTenantDto } from './interfaces/register-tenant.dto';
import { InternalApiGuard } from './guards/internal-api.guard';

@ApiTags('Internal API - Tenants')
@Controller('internal')
export class TenantsController {
  private readonly logger = new Logger(TenantsController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('register-tenant')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(InternalApiGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Registra un nuevo tenant desde Supabase',
    description: `Registra un nuevo tenant en PipeCore desde Supabase.

Este endpoint permite registrar un tenant en la base de datos de PipeCore con sus credenciales de API (api_key y api_secret) y configuración de servicios habilitados.

**Autenticación:** 
La autenticación se maneja mediante \`SERVICE_ROLE_SECRET\` en el header \`Authorization: Bearer <SERVICE_ROLE_SECRET>\`. Solo Supabase debe tener acceso a este secreto.

**Flujo:**
1. Supabase obtiene el tenant desde su tabla \`tenants\` (incluyendo \`name\`, \`api_key\`, \`api_secret\`, \`services\`)
2. Supabase llama a este endpoint con las credenciales del tenant
3. PipeCore valida que no exista un tenant con la misma \`api_key\`
4. PipeCore genera un UUID automáticamente para el nuevo tenant
5. PipeCore guarda el tenant en su base de datos con \`status = 'active'\`
6. PipeCore retorna el UUID generado

**Campos del Request Body:**
- \`name\` (opcional): Nombre del tenant. Se obtiene de la tabla \`tenants.name\` en Supabase. Si no se proporciona, se guarda como \`null\`.
- \`description\` (opcional): Descripción del tenant. Campo de texto libre.
- \`apiKey\` (obligatorio): API Key pública del tenant. Debe ser único en la base de datos. Formato recomendado: \`pk_live_\` o \`pk_test_\` seguido de caracteres alfanuméricos. Ejemplo: "example_key"
- \`apiSecret\` (obligatorio): API Secret del tenant usado para firmar JWT. ⚠️ NUNCA debe exponerse al frontend. Formato recomendado: \`sk_live_\` o \`sk_test_\` seguido de caracteres alfanuméricos. Ejemplo: "demo_123"
- \`services\` (opcional): Objeto con servicios habilitados. Campos disponibles:
  - \`delivery\` (Boolean): Servicio de entregas/delivery (Uber Direct, Rappi, etc.)
  - \`messaging\` (Boolean): Servicio de mensajería (SMS, WhatsApp via Twilio, Resend, etc.)
  - \`payments\` (Boolean): Servicio de pagos (MercadoPago, Transbank, etc.)
  Si no se proporciona, se guarda como objeto vacío \`{}\`.

**Descripción de los Campos de la Respuesta:**
- \`success\` (Boolean): Indica si el registro fue exitoso. Siempre será \`true\` si el registro es exitoso.
- \`id\` (String, UUID): Identificador único del tenant generado automáticamente por la base de datos. Formato UUID v4 (ej: "string"). Este UUID puede usarse para referencia interna, pero las peticiones se autentican con \`api_key\` y \`api_secret\`.

**Errores posibles:**
- \`401 Unauthorized\`: Token de servicio inválido o faltante. Verifica que el header \`Authorization\` contenga el \`SERVICE_ROLE_SECRET\` correcto.
- \`409 Conflict\`: Ya existe un tenant con la misma \`api_key\`. La \`api_key\` debe ser única en la base de datos.
- \`500 Internal Server Error\`: Error interno del servidor. Revisa los logs para más detalles.

**Notas importantes:**
- El \`id\` se genera automáticamente como UUID, no se envía en el request.
- La verificación de duplicados se hace por \`api_key\`, no por \`tenant_id\` (que ya no existe).
- El tenant se crea con \`status = 'active'\` por defecto.
- Los campos \`settings\` se inicializan con valores por defecto para messaging, payments, delivery y notifications.
- El registro en \`tenant_logs\` es opcional y no bloquea el registro si falla.`
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Tenant registrado exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { 
          type: 'boolean',
          example: true,
          description: 'Indica si el registro fue exitoso'
        },
        id: { 
          type: 'string',
          format: 'uuid',
          example: 'string',
          description: 'UUID generado automáticamente para el tenant'
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado - Token inválido' })
  @ApiResponse({ status: 409, description: 'El tenant ya existe' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async registerTenant(@Body() registerTenantDto: RegisterTenantDto): Promise<{ success: boolean; id: string }> {
    this.logger.log(`Recibida solicitud de registro de tenant con API Key: ${registerTenantDto.apiKey.substring(0, 10)}...`);
    return await this.authService.registerTenant(registerTenantDto);
  }
}
