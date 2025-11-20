import { Module } from '@nestjs/common';
import { UberModule } from './uber/uber.module';
import { MessagingModule } from './messaging/messaging.module';
import { TenantsModule } from './tenants/tenants.module';
import { PaymentsModule } from './payments/payments.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { JobsModule } from './jobs/jobs.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { InternalModule } from './internal/internal.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    InternalModule,
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
