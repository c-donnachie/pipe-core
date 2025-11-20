import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { InternalTenantsController } from './tenants.controller';
import { InternalMonitoringController } from './monitoring.controller';
import { InternalApiGuard } from './guards/internal-api.guard';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
  ],
  controllers: [
    InternalTenantsController,
    InternalMonitoringController,
  ],
  providers: [
    InternalApiGuard,
  ],
  exports: [
    InternalApiGuard,
  ],
})
export class InternalModule {}

