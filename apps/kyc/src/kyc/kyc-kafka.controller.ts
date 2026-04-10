import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { KycTier } from '../generated/prisma/enums';
import { KycService } from './kyc.service';

@Controller()
export class KycKafkaController {
  private readonly logger: Logger = new Logger(KycKafkaController.name);

  constructor(private kycService: KycService) {}

  @EventPattern('admin.events')
  async handleAdminEvents(@Payload() envelope: any) {
    this.logger.log('HANDLE ADMIN EVENTS');
    console.log({ envelope });

    const event = envelope?.payload?.event as string | undefined;
    const userId = envelope?.payload?.userId as string | undefined;

    if (!userId) return;

    if (event === 'admin.kyc_approved') {
      this.logger.log(`admin approved KYC for ${userId}`);
      try {
        await this.kycService.upgradeTier(userId, KycTier.VERIFIED);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`upgradeTier skipped for ${userId}: ${msg}`);
      }
    } else if (event === 'admin.kyc_rejected') {
      const reason = envelope?.payload?.reason as string | undefined;
      this.logger.warn(`admin rejected KYC for ${userId}: ${reason}`);
      try {
        await this.kycService.rejectProfile(userId, reason);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`rejectProfile skipped for ${userId}: ${msg}`);
      }
    }
  }

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
      await this.kycService.upgradeTier(userId, KycTier.BASIC);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`upgrade tier skipped for ${userId}: ${msg}`);
    }
  }
}
