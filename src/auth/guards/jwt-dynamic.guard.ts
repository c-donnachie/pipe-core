import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { DatabaseService } from '../../database/database.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtDynamicGuard implements CanActivate {
  private readonly logger = new Logger(JwtDynamicGuard.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    const tenantId = request.headers['x-tenant-id'] as string;

    if (!authHeader) {
      this.logger.warn('Intento de acceso sin Authorization header');
      throw new UnauthorizedException('Authorization header requerido');
    }

    if (!tenantId) {
      this.logger.warn('Intento de acceso sin X-Tenant-Id header');
      throw new UnauthorizedException('X-Tenant-Id header requerido');
    }

    const token = authHeader.replace('Bearer ', '');

    try {
      // Obtener el api_secret del tenant desde la base de datos
      const tenant = await this.databaseService.queryOne<{ api_secret: string; status: string }>(
        'SELECT api_secret, status FROM tenants WHERE tenant_id = $1',
        [tenantId]
      );

      if (!tenant) {
        this.logger.warn(`Tenant no encontrado: ${tenantId}`);
        throw new UnauthorizedException('Tenant no encontrado');
      }

      // Verificar si está activo
      if (tenant.status !== 'active') {
        this.logger.warn(`Tenant inactivo: ${tenantId} (status: ${tenant.status})`);
        throw new UnauthorizedException('Tenant inactivo');
      }

      // Verificar el JWT usando el api_secret del tenant
      const decoded = jwt.verify(token, tenant.api_secret) as JwtPayload;

      if (decoded.tenantId !== tenantId) {
        this.logger.warn(`TenantId en token no coincide con header: ${decoded.tenantId} !== ${tenantId}`);
        throw new UnauthorizedException('Token inválido: tenantId no coincide');
      }

      // Agregar información del tenant al request
      request.user = { tenantId: decoded.tenantId };

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      if (error instanceof jwt.JsonWebTokenError) {
        this.logger.warn(`Error verificando JWT: ${error.message}`);
        throw new UnauthorizedException('Token inválido');
      }

      if (error instanceof jwt.TokenExpiredError) {
        this.logger.warn('Token expirado');
        throw new UnauthorizedException('Token expirado');
      }

      this.logger.error('Error inesperado validando token', error);
      throw new UnauthorizedException('Error validando token');
    }
  }
}

