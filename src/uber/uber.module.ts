import { Module } from '@nestjs/common';
import { UberController } from './uber.controller';
import { UberService } from './uber.service';
import { UberAuthService } from './uber-auth.service';

@Module({
  controllers: [UberController],
  providers: [UberAuthService, UberService],
  exports: [UberService, UberAuthService],
})
export class UberModule {}
