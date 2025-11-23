import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';

@Injectable()
export class InternalApiGuard implements CanActivate {
  private readonly logger = new Logger(InternalApiGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      this.logger.warn('Intento de acceso sin Authorization header');
      throw new UnauthorizedException('Authorization header requerido');
    }

    const token = authHeader.replace('Bearer ', '');
    const serviceRoleSecret = process.env.SERVICE_ROLE_SECRET;

    if (!serviceRoleSecret) {
      this.logger.error('SERVICE_ROLE_SECRET no configurado');
      throw new UnauthorizedException('Configuración de seguridad inválida');
    }

    // Validar que el token coincida con SERVICE_ROLE_SECRET
    if (token !== serviceRoleSecret) {
      this.logger.warn('Intento de acceso con token inválido');
      throw new UnauthorizedException('Token de servicio inválido');
    }

    return true;
  }
}
