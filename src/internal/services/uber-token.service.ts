import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export interface UberToken {
  id: string;
  access_token: string;
  expires_at: Date;
  created_at: Date;
}

@Injectable()
export class UberTokenService {
  private readonly logger = new Logger(UberTokenService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Obtiene el token activo más reciente (que no haya expirado)
   */
  async getActiveToken(): Promise<UberToken | null> {
    try {
      const token = await this.databaseService.queryOne<UberToken>(
        `SELECT * FROM uber_direct_tokens 
         WHERE expires_at > NOW()
         ORDER BY created_at DESC 
         LIMIT 1`
      );

      if (token) {
        this.logger.log('Token activo encontrado');
      } else {
        this.logger.log('No hay token activo');
      }

      return token;
    } catch (error) {
      this.logger.error('Error obteniendo token activo:', error);
      throw error;
    }
  }

  /**
   * Guarda un nuevo token de Uber en la base de datos
   */
  async saveToken(
    accessToken: string,
    expiresIn: number
  ): Promise<UberToken> {
    try {
      const expiresAt = new Date(Date.now() + expiresIn * 1000);

      // Insertar nuevo token
      const result = await this.databaseService.query<UberToken>(
        `INSERT INTO uber_direct_tokens 
         (access_token, expires_at)
         VALUES ($1, $2)
         RETURNING *`,
        [accessToken, expiresAt]
      );

      this.logger.log(`Token guardado (expira en ${expiresIn} segundos)`);
      return result[0];
    } catch (error) {
      this.logger.error('Error guardando token:', error);
      throw error;
    }
  }
}

