import { Controller, Get, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DatabaseService } from './database.service';

@ApiTags('Database Test')
@Controller('test')
export class DatabaseController {
  private readonly logger = new Logger(DatabaseController.name);

  constructor(private readonly databaseService: DatabaseService) {}

  @Get()
  @ApiOperation({ summary: 'Prueba de conexión a la base de datos PostgreSQL' })
  @ApiResponse({ 
    status: 200, 
    description: 'Prueba de conexión exitosa',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        database: {
          type: 'object',
          properties: {
            connected: { type: 'boolean' },
            serverTime: { type: 'string' },
            version: { type: 'string' },
          },
        },
        environment: {
          type: 'object',
          properties: {
            databaseUrl: { type: 'string' },
            nodeEnv: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Error de conexión a la base de datos' 
  })
  async testConnection() {
    try {
      // Verificar si DATABASE_URL está configurada
      const databaseUrl = process.env.DATABASE_URL;
      const hasDatabaseUrl = !!databaseUrl;

      if (!hasDatabaseUrl) {
        return {
          success: false,
          message: 'DATABASE_URL no está configurada',
          database: {
            connected: false,
            error: 'Variable de entorno DATABASE_URL no encontrada',
          },
          environment: {
            databaseUrl: 'No configurada',
            nodeEnv: process.env.NODE_ENV || 'development',
          },
        };
      }

      // Ocultar credenciales en la respuesta
      const maskedUrl = databaseUrl
        ? databaseUrl.replace(/:[^:@]+@/, ':****@')
        : 'No configurada';

      // Probar conexión con una query simple
      const result = await this.databaseService.query<{ now: string; version: string }>(
        'SELECT NOW() as now, version() as version'
      );

      const dbInfo = result[0];

      this.logger.log('Prueba de conexión exitosa');

      return {
        success: true,
        message: 'Conexión a PostgreSQL exitosa',
        database: {
          connected: true,
          serverTime: dbInfo.now,
          version: dbInfo.version.split(' ')[0] + ' ' + dbInfo.version.split(' ')[1], // PostgreSQL 15.4
        },
        environment: {
          databaseUrl: maskedUrl,
          nodeEnv: process.env.NODE_ENV || 'development',
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Error en prueba de conexión', error);

      return {
        success: false,
        message: 'Error conectando a la base de datos',
        database: {
          connected: false,
          error: error.message || 'Error desconocido',
        },
        environment: {
          databaseUrl: process.env.DATABASE_URL
            ? process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@')
            : 'No configurada',
          nodeEnv: process.env.NODE_ENV || 'development',
        },
        timestamp: new Date().toISOString(),
      };
    }
  }
}

