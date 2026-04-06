import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { RequestsService } from './requests.service';

@Processor('social-jobs')
export class RequestsProcessor extends WorkerHost {
  private readonly logger = new Logger(RequestsProcessor.name);

  constructor(private readonly requestsService: RequestsService) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name === 'expire-request') {
      const { requestId } = job.data;
      this.logger.log(`Processing expiry for request ${requestId}`);
      await this.requestsService.expire(requestId);
    }
  }
}
