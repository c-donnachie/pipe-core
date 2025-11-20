import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaymentRouter } from './paymentRouter';
import { MercadoPagoAdapter } from './adapters/mercadoPagoAdapter';
import { TransbankAdapter } from './adapters/transbankAdapter';
import { StripeAdapter } from './adapters/stripeAdapter';
import { PaymentValidationService } from './services/paymentValidation.service';
import { PaymentLogService } from './services/paymentLog.service';

@Module({
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    PaymentRouter,
    MercadoPagoAdapter,
    TransbankAdapter,
    StripeAdapter,
    PaymentValidationService,
    PaymentLogService,
  ],
  exports: [PaymentsService, PaymentRouter],
})
export class PaymentsModule {}
