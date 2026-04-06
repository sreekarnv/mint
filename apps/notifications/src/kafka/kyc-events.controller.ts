import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { NotificationsService } from '../notifications/notifications.service';

// KYC service emits:
//   kyc.tier_upgraded      => user's KYC tier advanced (NONE => BASIC or BASIC => FULL = approved)
//   kyc.verification_failed => KYC rejected with a reason

@Controller()
export class KycEventsController {
  private readonly logger = new Logger(KycEventsController.name);

  constructor(private readonly notifications: NotificationsService) {}

  @EventPattern('kyc.events')
  async handleKycEvents(@Payload() envelope: any): Promise<void> {
    const event = envelope?.payload?.event;

    if (event === 'kyc.tier_upgraded') {
      await this.handleTierUpgraded(envelope.payload);
    } else if (event === 'kyc.verification_failed') {
      await this.handleVerificationFailed(envelope.payload);
    }
  }

  private async handleTierUpgraded(payload: any) {
    const isFull = payload.newTier === 'FULL';

    await this.notifications.create({
      userId: payload.userId,
      type: 'kyc.tier_upgraded',
      title: isFull ? 'Identity Fully Verified' : 'Verification Level Upgraded',
      body: isFull
        ? 'Your identity has been fully verified. You now have complete access to Mint.'
        : `Your verification level has been upgraded to ${payload.newTier}.`,
      data: { previousTier: payload.previousTier, newTier: payload.newTier },
    });

    if (isFull) {
      const email = await this.notifications.getUserEmail(payload.userId);
      if (email) {
        await this.notifications.enqueueEmail({
          to: email,
          subject: 'Identity Verified - Mint',
          template: 'kyc-approved',
          variables: {},
        });
      }
    }

    this.logger.log(
      `Processed kyc.tier_upgraded for ${payload.userId}: ${payload.previousTier} -> ${payload.newTier}`,
    );
  }

  private async handleVerificationFailed(payload: any) {
    await this.notifications.create({
      userId: payload.userId,
      type: 'kyc.verification_failed',
      title: 'Verification Failed',
      body: 'Your identity verification was not approved. Please resubmit with valid documents.',
      data: { reason: payload.reason },
    });

    const email = await this.notifications.getUserEmail(payload.userId);

    if (email) {
      await this.notifications.enqueueEmail({
        to: email,
        subject: 'Action Required - Identity Verification',
        template: 'kyc-rejected',
        variables: {
          reason: payload.reason ?? 'Documents could not be verified',
        },
      });
    }

    this.logger.log(`Processed kyc.verification_failed for ${payload.userId}`);
  }
}
