import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterTenantDto } from './interfaces/register-tenant.dto';
import { InternalApiGuard } from './guards/internal-api.guard';

@ApiTags('Internal API - Auth')
@Controller('pipecore/internal')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('register-tenant')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(InternalApiGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Registra un nuevo tenant desde Supabase',
    description: 'Endpoint interno protegido. Solo accesible con SERVICE_ROLE_SECRET.'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Tenant registrado exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        tenantId: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado - Token inválido' })
  @ApiResponse({ status: 409, description: 'El tenant ya existe' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async registerTenant(@Body() registerTenantDto: RegisterTenantDto): Promise<{ success: boolean; tenantId: string }> {
    this.logger.log(`Recibida solicitud de registro de tenant: ${registerTenantDto.tenantId}`);
    return await this.authService.registerTenant(registerTenantDto);
  }
}

