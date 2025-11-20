import { Controller, Get, Post, Body, Headers, UseGuards, Request, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { JwtDynamicGuard } from './guards/jwt-dynamic.guard';
import { AuthService } from './auth.service';
import * as jwt from 'jsonwebtoken';

@ApiTags('Auth Test')
@Controller('auth-test')
export class AuthTestController {
  private readonly logger = new Logger(AuthTestController.name);

  constructor(private readonly authService: AuthService) {}

  @Get('generate-jwt')
  @ApiOperation({ 
    summary: 'Genera un JWT de prueba para un tenant',
    description: 'Endpoint de desarrollo para generar JWT de prueba. Requiere tenantId y apiSecret en query params.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'JWT generado exitosamente',
    schema: {
      type: 'object',
      properties: {
        token: { type: 'string' },
        tenantId: { type: 'string' },
        expiresIn: { type: 'string' },
      },
    },
  })
  async generateJwt(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-api-secret') apiSecret: string,
  ) {
    if (!tenantId || !apiSecret) {
      return {
        error: 'Faltan headers requeridos',
        required: {
          'X-Tenant-Id': 'ID del tenant',
          'X-Api-Secret': 'API Secret del tenant',
        },
      };
    }

    try {
      const token = jwt.sign(
        { tenantId },
        apiSecret,
        { expiresIn: '1h' }
      );

      return {
        token,
        tenantId,
        expiresIn: '1h',
        usage: {
          header: 'Authorization: Bearer ' + token.substring(0, 20) + '...',
          'X-Tenant-Id': tenantId,
        },
      };
    } catch (error) {
      return {
        error: 'Error generando JWT',
        message: error.message,
      };
    }
  }

  @Get('protected')
  @UseGuards(JwtDynamicGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Endpoint protegido para probar JWT',
    description: 'Requiere JWT válido en Authorization header y X-Tenant-Id header'
  })
  @ApiHeader({ name: 'X-Tenant-Id', description: 'ID del tenant' })
  @ApiResponse({ 
    status: 200, 
    description: 'Acceso autorizado',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        tenantId: { type: 'string' },
        timestamp: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async protectedEndpoint(@Request() req) {
    return {
      success: true,
      message: 'JWT válido - Acceso autorizado',
      tenantId: req.user.tenantId,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('validate-tenant/:tenantId')
  @ApiOperation({ 
    summary: 'Verifica si un tenant existe y está activo',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Estado del tenant',
  })
  async validateTenant(@Headers('x-tenant-id') tenantId: string) {
    if (!tenantId) {
      return {
        error: 'Falta header X-Tenant-Id',
      };
    }

    const exists = await this.authService.validateTenant(tenantId);
    const secret = await this.authService.getTenantSecret(tenantId);

    return {
      tenantId,
      exists,
      hasSecret: !!secret,
      secretPreview: secret ? secret.substring(0, 10) + '...' : null,
    };
  }
}

