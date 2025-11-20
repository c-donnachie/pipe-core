import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  Logger, 
  HttpCode, 
  HttpStatus 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { 
  Tenant, 
  TenantCredentials, 
  TenantStats,
  CreateTenantDto,
  UpdateTenantDto 
} from './interfaces';

@ApiTags('Tenants Management')
@Controller('tenants')
export class TenantsController {
  private readonly logger = new Logger(TenantsController.name);

  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crea un nuevo tenant' })
  @ApiResponse({ 
    status: 201, 
    description: 'Tenant creado exitosamente',
    type: Object 
  })
  @ApiBody({ type: CreateTenantDto })
  async createTenant(@Body() createTenantDto: CreateTenantDto): Promise<Tenant> {
    this.logger.log(`Creando tenant: ${createTenantDto.name}`);
    return await this.tenantsService.createTenant(createTenantDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos los tenants' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de tenants obtenida exitosamente',
    type: [Object] 
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Número máximo de tenants a retornar' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Número de tenants a omitir' })
  async listTenants(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ): Promise<Tenant[]> {
    this.logger.log(`Listando tenants (limit: ${limit || 50}, offset: ${offset || 0})`);
    return await this.tenantsService.listTenants(limit || 50, offset || 0);
  }

  @Get(':tenantId')
  @ApiOperation({ summary: 'Obtiene un tenant por ID' })
  @ApiParam({ name: 'tenantId', description: 'ID del tenant' })
  @ApiResponse({ 
    status: 200, 
    description: 'Tenant obtenido exitosamente',
    type: Object 
  })
  @ApiResponse({ status: 404, description: 'Tenant no encontrado' })
  async getTenant(@Param('tenantId') tenantId: string): Promise<Tenant | null> {
    this.logger.log(`Obteniendo tenant: ${tenantId}`);
    return await this.tenantsService.getTenant(tenantId);
  }

  @Put(':tenantId')
  @ApiOperation({ summary: 'Actualiza un tenant' })
  @ApiParam({ name: 'tenantId', description: 'ID del tenant' })
  @ApiResponse({ 
    status: 200, 
    description: 'Tenant actualizado exitosamente',
    type: Object 
  })
  @ApiResponse({ status: 404, description: 'Tenant no encontrado' })
  @ApiBody({ type: UpdateTenantDto })
  async updateTenant(
    @Param('tenantId') tenantId: string,
    @Body() updateTenantDto: UpdateTenantDto
  ): Promise<Tenant> {
    this.logger.log(`Actualizando tenant: ${tenantId}`);
    return await this.tenantsService.updateTenant(tenantId, updateTenantDto);
  }

  @Get(':tenantId/credentials')
  @ApiOperation({ summary: 'Obtiene las credenciales de un tenant' })
  @ApiParam({ name: 'tenantId', description: 'ID del tenant' })
  @ApiQuery({ name: 'provider', required: false, type: String, description: 'Filtrar por proveedor específico' })
  @ApiResponse({ 
    status: 200, 
    description: 'Credenciales obtenidas exitosamente',
    type: [Object] 
  })
  async getTenantCredentials(
    @Param('tenantId') tenantId: string,
    @Query('provider') provider?: string
  ): Promise<TenantCredentials[]> {
    this.logger.log(`Obteniendo credenciales para tenant: ${tenantId}${provider ? `, proveedor: ${provider}` : ''}`);
    return await this.tenantsService.getTenantCredentials(tenantId, provider);
  }

  @Put(':tenantId/credentials/:provider')
  @ApiOperation({ summary: 'Actualiza las credenciales de un tenant para un proveedor' })
  @ApiParam({ name: 'tenantId', description: 'ID del tenant' })
  @ApiParam({ name: 'provider', description: 'Nombre del proveedor' })
  @ApiResponse({ 
    status: 200, 
    description: 'Credenciales actualizadas exitosamente',
    type: Object 
  })
  @ApiResponse({ status: 404, description: 'Tenant no encontrado' })
  async updateTenantCredentials(
    @Param('tenantId') tenantId: string,
    @Param('provider') provider: string,
    @Body() credentials: Record<string, any>
  ): Promise<TenantCredentials> {
    this.logger.log(`Actualizando credenciales para tenant: ${tenantId}, proveedor: ${provider}`);
    return await this.tenantsService.updateTenantCredentials(tenantId, provider, credentials);
  }

  @Get(':tenantId/stats')
  @ApiOperation({ summary: 'Obtiene estadísticas de un tenant' })
  @ApiParam({ name: 'tenantId', description: 'ID del tenant' })
  @ApiResponse({ 
    status: 200, 
    description: 'Estadísticas obtenidas exitosamente',
    type: Object 
  })
  async getTenantStats(@Param('tenantId') tenantId: string): Promise<TenantStats> {
    this.logger.log(`Obteniendo estadísticas para tenant: ${tenantId}`);
    return await this.tenantsService.getTenantStats(tenantId);
  }

  @Put(':tenantId/activate')
  @ApiOperation({ summary: 'Activa un tenant' })
  @ApiParam({ name: 'tenantId', description: 'ID del tenant' })
  @ApiResponse({ 
    status: 200, 
    description: 'Tenant activado exitosamente',
    schema: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' } } }
  })
  async activateTenant(@Param('tenantId') tenantId: string): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Activando tenant: ${tenantId}`);
    await this.tenantsService.activateTenant(tenantId);
    return {
      success: true,
      message: `Tenant ${tenantId} activado exitosamente`
    };
  }

  @Put(':tenantId/deactivate')
  @ApiOperation({ summary: 'Desactiva un tenant' })
  @ApiParam({ name: 'tenantId', description: 'ID del tenant' })
  @ApiResponse({ 
    status: 200, 
    description: 'Tenant desactivado exitosamente',
    schema: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' } } }
  })
  async deactivateTenant(@Param('tenantId') tenantId: string): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Desactivando tenant: ${tenantId}`);
    await this.tenantsService.deactivateTenant(tenantId);
    return {
      success: true,
      message: `Tenant ${tenantId} desactivado exitosamente`
    };
  }

  @Get('health/check')
  @ApiOperation({ summary: 'Health check del servicio de tenants' })
  @ApiResponse({ 
    status: 200, 
    description: 'Estado del servicio obtenido exitosamente',
    type: Object 
  })
  async healthCheck(): Promise<{ status: string; timestamp: string; tenants: number }> {
    this.logger.log('Realizando health check del servicio de tenants');
    return await this.tenantsService.healthCheck();
  }
}
