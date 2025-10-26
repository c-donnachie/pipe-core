import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { JobQueue } from './jobQueue';
import { JobProcessor } from './jobProcessor';
import { JobScheduler } from './jobScheduler';
import { JobRetryService } from './services/jobRetry.service';
import { JobLogService } from './services/jobLog.service';

@Module({
  controllers: [JobsController],
  providers: [
    JobsService,
    JobQueue,
    JobProcessor,
    JobScheduler,
    JobRetryService,
    JobLogService,
  ],
  exports: [JobsService, JobQueue, JobScheduler],
})
export class JobsModule {}
