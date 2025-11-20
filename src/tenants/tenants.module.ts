import { Module } from '@nestjs/common';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';
import { TenantConfigService } from './services/tenantConfig.service';
import { TenantCredentialsService } from './services/tenantCredentials.service';
import { TenantValidationService } from './services/tenantValidation.service';

@Module({
  controllers: [TenantsController],
  providers: [
    TenantsService,
    TenantConfigService,
    TenantCredentialsService,
    TenantValidationService,
  ],
  exports: [TenantsService, TenantConfigService],
})
export class TenantsModule {}
