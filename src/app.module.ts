import { Module } from '@nestjs/common';
import { UberModule } from './uber/uber.module';

@Module({
  imports: [UberModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
