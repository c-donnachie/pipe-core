import { Module } from '@nestjs/common';
import { UberModule } from './uber/uber.module';
import { MessagingModule } from './messaging/messaging.module';
import { TenantsModule } from './tenants/tenants.module';
import { PaymentsModule } from './payments/payments.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { JobsModule } from './jobs/jobs.module';

@Module({
  imports: [
    UberModule, 
    MessagingModule,
    TenantsModule,
    PaymentsModule,
    WebhooksModule,
    JobsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
