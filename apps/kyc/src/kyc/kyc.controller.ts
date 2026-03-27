import {
  Body,
  Controller,
  Get,
  Headers,
  Logger,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { KycService } from './kyc.service';
import type { Request } from 'express';
import { JWTAuthGuard } from '@mint/common';
import { createHmac } from 'crypto';
import { KycTier } from '../generated/prisma/enums';

@Controller('api/v1/kyc')
export class KycController {
  private readonly logger: Logger = new Logger(KycController.name);

  constructor(private readonly kycService: KycService) {}

  @Get()
  @UseGuards(JWTAuthGuard)
  async getOrCreateProfile(@Req() req: Request) {
    const { sub } = (req as any).user;
    return await this.kycService.getOrCreateProfile(sub);
  }

  @Get('limits')
  @UseGuards(JWTAuthGuard)
  async getLimits(@Req() req: Request) {
    const { sub } = (req as any).user;
    const { tier } = await this.kycService.getTierCached(sub);
    return {
      tier,
      ...KycService.getLimitsForTier(tier),
    };
  }

  @Post('submit')
  @UseGuards(JWTAuthGuard)
  async submitForReview(@Req() req: Request): Promise<{ message: string }> {
    const { sub } = (req as any).user;
    await this.kycService.submitForReview(sub);
    return {
      message: 'Documents submitted for review',
    };
  }

  @Post('webhook')
  async handleProviderWebhook(
    @Body() body: any,
    @Headers('x-persona-signature') signature: string,
  ) {
    const secret = process.env.KYC_WEBHOOK_SECRET ?? 'secret';

    if (secret) {
      const expected = createHmac('sha256', secret)
        .update(JSON.stringify(body))
        .digest('hex');

      if (signature !== `sha256=${expected}`) {
        throw new UnauthorizedException('Invalid signature');
      }
    }

    const status = body?.data?.attributes?.status;
    const userId = body?.data?.attributes?.externalId;

    if (!userId) {
      this.logger.warn(
        `Webhook received with no userId — ignoring: ${JSON.stringify(body)}`,
      );
      return;
    }

    if (status === 'approved') {
      await this.kycService.upgradeTier(userId, KycTier.VERIFIED);
    } else if (status === 'declined') {
      await this.kycService.rejectProfile(
        userId,
        body?.data?.attributes?.reason,
      );
    } else {
      this.logger.log(
        `Unhandled webhook status "${status}" for user ${userId}. No action taken`,
      );
    }
  }
}
