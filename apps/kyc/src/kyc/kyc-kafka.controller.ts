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
    const event = envelope?.payload?.event as string | undefined;
    const profileId = envelope?.payload?.profileId as string | undefined;

    if (!profileId) return;

    const profile = await this.kycService.getProfileById(profileId);
    if (!profile) {
      this.logger.warn(`admin event ${event}: profile ${profileId} not found`);
      return;
    }

    if (event === 'admin.kyc_approved') {
      this.logger.log(`admin approved KYC for user ${profile.userId}`);
      try {
        await this.kycService.upgradeTier(profile.userId, KycTier.VERIFIED);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`upgradeTier skipped for ${profile.userId}: ${msg}`);
      }
    } else if (event === 'admin.kyc_rejected') {
      const reason = envelope?.payload?.reason as string | undefined;
      this.logger.warn(`admin rejected KYC for user ${profile.userId}: ${reason}`);
      
      try {
        await this.kycService.rejectProfile(profile.userId, reason);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`rejectProfile skipped for ${profile.userId}: ${msg}`);
      }
    }
  }

  @EventPattern('auth.events')
  async handleAuthEvents(@Payload() envelope: any) {
    const event = envelope?.payload?.event as string | undefined;

    if (event !== 'auth.user_verified') return;

    const userId = envelope.payload.userId as string;
    if (!userId) return;

    this.logger.log(`auth.user_verified upgrading ${userId} to BASIC`);
    try {
      await this.kycService.upgradeTier(userId, KycTier.BASIC);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`upgrade tier skipped for ${userId}: ${msg}`);
    }
  }
}
