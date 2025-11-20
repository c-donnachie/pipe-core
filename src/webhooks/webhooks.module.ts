import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { WebhookRouter } from './webhookRouter';
import { WebhookValidationService } from './services/webhookValidation.service';
import { WebhookLogService } from './services/webhookLog.service';
import { WebhookRetryService } from './services/webhookRetry.service';

@Module({
  controllers: [WebhooksController],
  providers: [
    WebhooksService,
    WebhookRouter,
    WebhookValidationService,
    WebhookLogService,
    WebhookRetryService,
  ],
  exports: [WebhooksService, WebhookRouter],
})
export class WebhooksModule {}
