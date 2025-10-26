import { 
  Controller, 
  Post, 
  Get, 
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
import { JobsService } from './jobs.service';
import { 
  Job, 
  ScheduledJob, 
  JobStats,
  CreateJobDto,
  ScheduleJobDto 
} from './interfaces';

@ApiTags('Jobs Management')
@Controller('jobs')
export class JobsController {
  private readonly logger = new Logger(JobsController.name);

  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crea un nuevo trabajo' })
  @ApiResponse({ 
    status: 201, 
    description: 'Trabajo creado exitosamente',
    type: Object 
  })
  @ApiResponse({ status: 400, description: 'Datos del trabajo inválidos' })
  @ApiBody({ type: CreateJobDto })
  async createJob(@Body() createJobDto: CreateJobDto): Promise<Job> {
    this.logger.log(`Creando trabajo: ${createJobDto.type} para tenant: ${createJobDto.tenantId}`);
    return await this.jobsService.createJob(createJobDto);
  }

  @Post('schedule')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Programa un trabajo recurrente' })
  @ApiResponse({ 
    status: 200, 
    description: 'Trabajo programado exitosamente',
    schema: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' } } }
  })
  @ApiResponse({ status: 400, description: 'Datos de programación inválidos' })
  @ApiBody({ type: ScheduleJobDto })
  async scheduleJob(@Body() scheduleJobDto: ScheduleJobDto): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Programando trabajo: ${scheduleJobDto.jobType} para tenant: ${scheduleJobDto.tenantId}`);
    await this.jobsService.scheduleJob(scheduleJobDto);
    return {
      success: true,
      message: `Trabajo ${scheduleJobDto.id} programado exitosamente`
    };
  }

  @Get(':jobId')
  @ApiOperation({ summary: 'Obtiene el estado de un trabajo' })
  @ApiParam({ name: 'jobId', description: 'ID del trabajo' })
  @ApiResponse({ 
    status: 200, 
    description: 'Estado del trabajo obtenido exitosamente',
    type: Object 
  })
  @ApiResponse({ status: 404, description: 'Trabajo no encontrado' })
  async getJobStatus(@Param('jobId') jobId: string): Promise<Job | null> {
    this.logger.log(`Obteniendo estado de trabajo: ${jobId}`);
    return await this.jobsService.getJobStatus(jobId);
  }

  @Put(':jobId/cancel')
  @ApiOperation({ summary: 'Cancela un trabajo' })
  @ApiParam({ name: 'jobId', description: 'ID del trabajo' })
  @ApiResponse({ 
    status: 200, 
    description: 'Trabajo cancelado exitosamente',
    schema: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' } } }
  })
  @ApiResponse({ status: 404, description: 'Trabajo no encontrado' })
  async cancelJob(@Param('jobId') jobId: string): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Cancelando trabajo: ${jobId}`);
    await this.jobsService.cancelJob(jobId);
    return {
      success: true,
      message: `Trabajo ${jobId} cancelado exitosamente`
    };
  }

  @Post(':jobId/retry')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reintenta un trabajo fallido' })
  @ApiParam({ name: 'jobId', description: 'ID del trabajo' })
  @ApiResponse({ 
    status: 200, 
    description: 'Trabajo programado para reintento exitosamente',
    type: Object 
  })
  @ApiResponse({ status: 404, description: 'Trabajo no encontrado' })
  async retryJob(@Param('jobId') jobId: string): Promise<Job | null> {
    this.logger.log(`Reintentando trabajo: ${jobId}`);
    return await this.jobsService.retryJob(jobId);
  }

  @Get()
  @ApiOperation({ summary: 'Obtiene trabajos de un tenant' })
  @ApiQuery({ name: 'tenant_id', description: 'ID del tenant' })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'processing', 'completed', 'failed'], description: 'Estado del trabajo' })
  @ApiQuery({ name: 'type', required: false, description: 'Tipo de trabajo' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Número máximo de trabajos a retornar' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Número de trabajos a omitir' })
  @ApiResponse({ 
    status: 200, 
    description: 'Trabajos obtenidos exitosamente',
    type: [Object] 
  })
  async getJobs(
    @Query('tenant_id') tenantId: string,
    @Query('status') status?: 'pending' | 'processing' | 'completed' | 'failed',
    @Query('type') type?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ): Promise<Job[]> {
    this.logger.log(`Obteniendo trabajos para tenant: ${tenantId}`);
    return await this.jobsService.getJobs(tenantId, status, type as any, limit || 50, offset || 0);
  }

  @Get('scheduled')
  @ApiOperation({ summary: 'Obtiene trabajos programados' })
  @ApiQuery({ name: 'tenant_id', required: false, description: 'ID del tenant' })
  @ApiResponse({ 
    status: 200, 
    description: 'Trabajos programados obtenidos exitosamente',
    type: [Object] 
  })
  async getScheduledJobs(@Query('tenant_id') tenantId?: string): Promise<ScheduledJob[]> {
    this.logger.log(`Obteniendo trabajos programados para tenant: ${tenantId || 'global'}`);
    return await this.jobsService.getScheduledJobs(tenantId);
  }

  @Put('scheduled/:jobId/activate')
  @ApiOperation({ summary: 'Activa un trabajo programado' })
  @ApiParam({ name: 'jobId', description: 'ID del trabajo programado' })
  @ApiResponse({ 
    status: 200, 
    description: 'Trabajo programado activado exitosamente',
    schema: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' } } }
  })
  async activateScheduledJob(@Param('jobId') jobId: string): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Activando trabajo programado: ${jobId}`);
    await this.jobsService.activateScheduledJob(jobId);
    return {
      success: true,
      message: `Trabajo programado ${jobId} activado exitosamente`
    };
  }

  @Put('scheduled/:jobId/deactivate')
  @ApiOperation({ summary: 'Desactiva un trabajo programado' })
  @ApiParam({ name: 'jobId', description: 'ID del trabajo programado' })
  @ApiResponse({ 
    status: 200, 
    description: 'Trabajo programado desactivado exitosamente',
    schema: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' } } }
  })
  async deactivateScheduledJob(@Param('jobId') jobId: string): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Desactivando trabajo programado: ${jobId}`);
    await this.jobsService.deactivateScheduledJob(jobId);
    return {
      success: true,
      message: `Trabajo programado ${jobId} desactivado exitosamente`
    };
  }

  @Post('scheduled/:jobId/execute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ejecuta un trabajo programado inmediatamente' })
  @ApiParam({ name: 'jobId', description: 'ID del trabajo programado' })
  @ApiResponse({ 
    status: 200, 
    description: 'Trabajo programado ejecutado exitosamente',
    type: Object 
  })
  @ApiResponse({ status: 404, description: 'Trabajo programado no encontrado' })
  async executeScheduledJob(@Param('jobId') jobId: string): Promise<Job | null> {
    this.logger.log(`Ejecutando trabajo programado: ${jobId}`);
    return await this.jobsService.executeScheduledJob(jobId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obtiene estadísticas de trabajos' })
  @ApiQuery({ name: 'tenant_id', required: false, description: 'ID del tenant' })
  @ApiResponse({ 
    status: 200, 
    description: 'Estadísticas obtenidas exitosamente',
    type: Object 
  })
  async getJobStats(@Query('tenant_id') tenantId?: string): Promise<JobStats> {
    this.logger.log(`Obteniendo estadísticas de trabajos para tenant: ${tenantId || 'global'}`);
    return await this.jobsService.getJobStats(tenantId);
  }

  @Get('logs')
  @ApiOperation({ summary: 'Obtiene logs de trabajos' })
  @ApiQuery({ name: 'tenant_id', description: 'ID del tenant' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Número máximo de logs a retornar' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Número de logs a omitir' })
  @ApiQuery({ name: 'type', required: false, description: 'Tipo de trabajo' })
  @ApiResponse({ 
    status: 200, 
    description: 'Logs obtenidos exitosamente',
    type: [Object] 
  })
  async getJobLogs(
    @Query('tenant_id') tenantId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('type') type?: string
  ): Promise<any[]> {
    this.logger.log(`Obteniendo logs de trabajos para tenant: ${tenantId}`);
    return await this.jobsService.getJobLogs(tenantId, limit || 50, offset || 0, type as any);
  }

  @Get('queue/status')
  @ApiOperation({ summary: 'Obtiene el estado de las colas' })
  @ApiResponse({ 
    status: 200, 
    description: 'Estado de las colas obtenido exitosamente',
    type: Object 
  })
  async getQueueStatus(): Promise<Record<string, any>> {
    this.logger.log('Obteniendo estado de las colas');
    return this.jobsService.getQueueStatus();
  }

  @Get('types')
  @ApiOperation({ summary: 'Obtiene tipos de trabajos disponibles' })
  @ApiResponse({ 
    status: 200, 
    description: 'Tipos de trabajos obtenidos exitosamente',
    type: [Object] 
  })
  async getAvailableJobTypes(): Promise<Array<{
    type: string;
    description: string;
    estimatedTime: string;
  }>> {
    this.logger.log('Obteniendo tipos de trabajos disponibles');
    return this.jobsService.getAvailableJobTypes();
  }

  @Post('cleanup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Limpia trabajos antiguos' })
  @ApiQuery({ name: 'tenant_id', description: 'ID del tenant' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Días a mantener' })
  @ApiResponse({ 
    status: 200, 
    description: 'Limpieza completada exitosamente',
    schema: { type: 'object', properties: { success: { type: 'boolean' }, removed: { type: 'number' } } }
  })
  async cleanupOldJobs(
    @Query('tenant_id') tenantId: string,
    @Query('days') days?: number
  ): Promise<{ success: boolean; removed: number }> {
    this.logger.log(`Limpiando trabajos antiguos para tenant: ${tenantId}`);
    const removed = await this.jobsService.cleanupOldJobs(tenantId, days || 7);
    return { success: true, removed };
  }

  @Post('reprocess-failed')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reprocesa trabajos fallidos' })
  @ApiQuery({ name: 'tenant_id', description: 'ID del tenant' })
  @ApiQuery({ name: 'type', required: false, description: 'Tipo de trabajo específico' })
  @ApiResponse({ 
    status: 200, 
    description: 'Reprocesamiento completado exitosamente',
    schema: { type: 'object', properties: { success: { type: 'boolean' }, processed: { type: 'number' } } }
  })
  async reprocessFailedJobs(
    @Query('tenant_id') tenantId: string,
    @Query('type') type?: string
  ): Promise<{ success: boolean; processed: number }> {
    this.logger.log(`Reprocesando trabajos fallidos para tenant: ${tenantId}`);
    const processed = await this.jobsService.reprocessFailedJobs(tenantId, type as any);
    return { success: true, processed };
  }

  @Get('health/check')
  @ApiOperation({ summary: 'Health check del servicio de trabajos' })
  @ApiResponse({ 
    status: 200, 
    description: 'Estado del servicio obtenido exitosamente',
    type: Object 
  })
  async healthCheck(): Promise<{
    status: string;
    timestamp: string;
    queues: number;
    processors: number;
    scheduledJobs: number;
  }> {
    this.logger.log('Realizando health check del servicio de trabajos');
    return await this.jobsService.healthCheck();
  }
}
