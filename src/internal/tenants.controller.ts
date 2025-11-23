import { Controller, Post, Get, Body, Query, UseGuards, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthService } from '../auth/auth.service';
import { RegisterTenantDto } from './interfaces/register-tenant.dto';
import { InternalApiGuard } from './guards/internal-api.guard';
import { DatabaseService } from '../database/database.service';

@ApiTags('Internal API - Tenants')
@Controller('internal/tenants')
@UseGuards(InternalApiGuard)
@ApiBearerAuth('service-role-secret')
export class InternalTenantsController {
  private readonly logger = new Logger(InternalTenantsController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly databaseService: DatabaseService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
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

  @Get()
  @ApiOperation({ 
    summary: 'Lista todos los tenants',
    description: 'Endpoint interno para listar todos los tenants registrados en la base de datos. Solo accesible con SERVICE_ROLE_SECRET.'
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Número máximo de tenants a retornar (default: 50, máximo: 100)' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Número de tenants a omitir (default: 0)' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Filtrar por status: active, inactive, suspended' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Buscar por tenant_id o name (búsqueda parcial)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de tenants obtenida exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tenant_id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              api_key: { type: 'string' },
              api_secret_preview: { type: 'string' },
              status: { type: 'string' },
              services: { type: 'object' },
              created_at: { type: 'string' },
              updated_at: { type: 'string' },
            },
          },
        },
        pagination: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            limit: { type: 'number' },
            offset: { type: 'number' },
            hasMore: { type: 'boolean' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado - Token inválido' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async listTenants(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    this.logger.log(`Listando tenants (limit: ${limit || 50}, offset: ${offset || 0}, status: ${status || 'all'}, search: ${search || 'none'})`);

    try {
      const limitValue = limit ? Math.min(Math.max(limit, 1), 100) : 50; // Entre 1 y 100
      const offsetValue = Math.max(offset || 0, 0); // No negativo

      let query = `
        SELECT 
          tenant_id,
          name,
          description,
          api_key,
          LEFT(api_secret, 10) || '...' as api_secret_preview,
          status,
          settings,
          services,
          created_at,
          updated_at
        FROM tenants
      `;

      const params: any[] = [];
      const conditions: string[] = [];

      // Filtro por status
      if (status && ['active', 'inactive', 'suspended'].includes(status)) {
        conditions.push(`status = $${params.length + 1}`);
        params.push(status);
      }

      // Búsqueda por tenant_id o name
      if (search && search.trim().length > 0) {
        conditions.push(`(tenant_id ILIKE $${params.length + 1} OR name ILIKE $${params.length + 1})`);
        params.push(`%${search.trim()}%`);
      }

      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }

      query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limitValue, offsetValue);

      const tenants = await this.databaseService.query(query, params);

      // Contar total con los mismos filtros
      let countQuery = 'SELECT COUNT(*) as total FROM tenants';
      const countParams: any[] = [];
      const countConditions: string[] = [];

      if (status && ['active', 'inactive', 'suspended'].includes(status)) {
        countConditions.push(`status = $${countParams.length + 1}`);
        countParams.push(status);
      }

      if (search && search.trim().length > 0) {
        countConditions.push(`(tenant_id ILIKE $${countParams.length + 1} OR name ILIKE $${countParams.length + 1})`);
        countParams.push(`%${search.trim()}%`);
      }

      if (countConditions.length > 0) {
        countQuery += ` WHERE ${countConditions.join(' AND ')}`;
      }

      const countResult = await this.databaseService.queryOne<{ total: string }>(countQuery, countParams);
      const total = parseInt(countResult?.total || '0', 10);

      return {
        success: true,
        data: tenants,
        pagination: {
          total,
          limit: limitValue,
          offset: offsetValue,
          hasMore: offsetValue + limitValue < total,
          totalPages: Math.ceil(total / limitValue),
          currentPage: Math.floor(offsetValue / limitValue) + 1,
        },
        filters: {
          status: status || 'all',
          search: search || null,
        },
      };
    } catch (error) {
      this.logger.error('Error listando tenants', error);
      throw error;
    }
  }

  @Get('stats')
  @ApiOperation({ 
    summary: 'Estadísticas de tenants',
    description: 'Endpoint interno para obtener estadísticas generales de tenants. Solo accesible con SERVICE_ROLE_SECRET.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Estadísticas obtenidas exitosamente',
  })
  async getTenantsStats() {
    this.logger.log('Obteniendo estadísticas de tenants');

    const stats = await this.databaseService.queryOne<{
      total: string;
      active: string;
      inactive: string;
      suspended: string;
    }>(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'active') as active,
        COUNT(*) FILTER (WHERE status = 'inactive') as inactive,
        COUNT(*) FILTER (WHERE status = 'suspended') as suspended
      FROM tenants
    `);

    return {
      success: true,
      stats: {
        total: parseInt(stats?.total || '0', 10),
        active: parseInt(stats?.active || '0', 10),
        inactive: parseInt(stats?.inactive || '0', 10),
        suspended: parseInt(stats?.suspended || '0', 10),
      },
    };
  }
}

