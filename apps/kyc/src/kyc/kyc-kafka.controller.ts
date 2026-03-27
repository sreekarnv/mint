import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { KycService } from './kyc.service';
import { KycTier } from '../generated/prisma/enums';

@Controller()
export class KycKafkaController {
  private readonly logger: Logger = new Logger(KycKafkaController.name);

  constructor(private kycService: KycService) {}

  @EventPattern('auth.events')
  //   TODO: type envelop
  async handleAuthEvents(@Payload() envelope: any) {
    const event = envelope?.payload?.event as string | undefined;

    if (event !== 'auth.user_verified') {
      return;
    }

    const userId = envelope.payload.userId as string;

    if (!userId) {
      return;
    }

    this.logger.log(`auth.user_verified upgrading ${userId} to BASIC`);

    try {
      this.kycService.upgradeTier(userId, KycTier.BASIC);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`upgrade tier skipped for ${userId}: ${msg}`);
    }
  }
}
