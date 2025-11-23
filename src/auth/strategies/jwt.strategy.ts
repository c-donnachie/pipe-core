import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { DatabaseService } from '../../database/database.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(private readonly databaseService: DatabaseService) {
    // Usamos un secret temporal, pero lo sobrescribiremos en validate
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'temporary-secret', // Se sobrescribe en validate
    });
  }

  async validate(payload: JwtPayload, request: any): Promise<{ tenantId: string }> {
    const tenantId = payload.tenantId;

    if (!tenantId) {
      this.logger.warn('JWT payload sin tenantId');
      throw new UnauthorizedException('Token inválido: tenantId no encontrado');
    }

    // Verificar que el tenant existe y está activo
    const tenant = await this.databaseService.queryOne<{ id: string; status: string; api_secret: string }>(
      'SELECT id, status, api_secret FROM tenants WHERE id = $1',
      [tenantId]
    );

    if (!tenant) {
      this.logger.warn(`Tenant no encontrado: ${tenantId}`);
      throw new UnauthorizedException('Tenant no encontrado');
    }

    if (tenant.status !== 'active') {
      this.logger.warn(`Tenant inactivo: ${tenantId}`);
      throw new UnauthorizedException('Tenant inactivo');
    }

    return { tenantId };
  }
}

