import { Module } from '@nestjs/common';
import { UberModule } from './uber/uber.module';
import { MessagingModule } from './messaging/messaging.module';

@Module({
  imports: [UberModule, MessagingModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
