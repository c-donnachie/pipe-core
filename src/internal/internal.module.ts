import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { UberModule } from '../uber/uber.module';
import { TenantsController } from './tenants.controller';
import { DeliveryController } from './delivery.controller';
import { UberTokenService } from './services/uber-token.service';
import { InternalApiGuard } from './guards/internal-api.guard';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    UberModule,
  ],
  controllers: [
    TenantsController,
    DeliveryController,
  ],
  providers: [
    UberTokenService,
    InternalApiGuard,
  ],
  exports: [
    UberTokenService,
    InternalApiGuard,
  ],
})
export class InternalModule {}
