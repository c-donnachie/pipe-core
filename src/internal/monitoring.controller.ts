import { Controller, Get, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InternalApiGuard } from './guards/internal-api.guard';
import { DatabaseService } from '../database/database.service';

@ApiTags('Internal API - Monitoring')
@Controller('internal/monitoring')
@UseGuards(InternalApiGuard)
@ApiBearerAuth('service-role-secret')
export class InternalMonitoringController {
  private readonly logger = new Logger(InternalMonitoringController.name);

  constructor(private readonly databaseService: DatabaseService) {}

  @Get('health')
  @ApiOperation({ 
    summary: 'Health check del sistema',
    description: 'Endpoint interno para verificar el estado del sistema. Solo accesible con SERVICE_ROLE_SECRET.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Estado del sistema obtenido exitosamente',
  })
  async getHealth() {
    this.logger.log('Verificando salud del sistema');

    const dbHealth = await this.databaseService.queryOne<{ now: string; version: string }>(
      'SELECT NOW() as now, version() as version'
    );

    return {
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: !!dbHealth,
        serverTime: dbHealth?.now,
        version: dbHealth?.version?.split(' ')[0] + ' ' + dbHealth?.version?.split(' ')[1],
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || 'development',
      },
    };
  }

  @Get('database/stats')
  @ApiOperation({ 
    summary: 'Estadísticas de la base de datos',
    description: 'Endpoint interno para obtener estadísticas de la base de datos. Solo accesible con SERVICE_ROLE_SECRET.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Estadísticas obtenidas exitosamente',
  })
  async getDatabaseStats() {
    this.logger.log('Obteniendo estadísticas de la base de datos');

    const stats = await this.databaseService.queryOne<{
      tenants_count: string;
      credentials_count: string;
      logs_count: string;
    }>(`
      SELECT 
        (SELECT COUNT(*) FROM tenants) as tenants_count,
        (SELECT COUNT(*) FROM tenant_credentials) as credentials_count,
        (SELECT COUNT(*) FROM tenant_logs WHERE created_at > NOW() - INTERVAL '24 hours') as logs_count
    `);

    return {
      success: true,
      stats: {
        tenants: parseInt(stats?.tenants_count || '0', 10),
        credentials: parseInt(stats?.credentials_count || '0', 10),
        logsLast24h: parseInt(stats?.logs_count || '0', 10),
      },
      timestamp: new Date().toISOString(),
    };
  }
}

