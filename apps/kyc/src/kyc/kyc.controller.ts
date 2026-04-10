import { JWTAuthGuard } from '@mint/common';
import {
  Body,
  Controller,
  Get,
  Headers,
  InternalServerErrorException,
  Logger,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { createHmac } from 'crypto';
import type { Request } from 'express';
import { KycTier } from '../generated/prisma/enums';
import { KycService } from './kyc.service';

@ApiTags('kyc')
@ApiBearerAuth('access-token')
@Controller('api/v1/kyc')
export class KycController {
  private readonly logger: Logger = new Logger(KycController.name);

  constructor(private readonly kycService: KycService) {}

  @Get()
  @UseGuards(JWTAuthGuard)
  @ApiOperation({
    summary: 'Get or create KYC profile for the authenticated user',
  })
  @ApiResponse({ status: 200, description: 'KYC profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getOrCreateProfile(@Req() req: Request) {
    const { sub } = (req as any).user;
    return await this.kycService.getOrCreateProfile(sub);
  }

  @Get('limits')
  @UseGuards(JWTAuthGuard)
  @ApiOperation({ summary: 'Get transaction limits for the current KYC tier' })
  @ApiResponse({ status: 200, description: 'Tier and limits' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiOperation({ summary: 'Submit uploaded documents for KYC review' })
  @ApiResponse({ status: 201, description: 'Documents submitted for review' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async submitForReview(@Req() req: Request): Promise<{ message: string }> {
    const { sub } = (req as any).user;
    await this.kycService.submitForReview(sub);
    return {
      message: 'Documents submitted for review',
    };
  }

  @Post('webhook')
  @ApiOperation({
    summary: 'Receive KYC status webhook from identity provider (Persona)',
  })
  @ApiResponse({ status: 201, description: 'Webhook processed' })
  @ApiResponse({ status: 401, description: 'Invalid HMAC signature' })
  async handleProviderWebhook(
    @Body() body: any,
    @Headers('x-persona-signature') signature: string,
  ) {
    const secret = process.env.KYC_WEBHOOK_SECRET;

    if (!secret) {
      throw new InternalServerErrorException('Webhook secret not configured');
    }

    const expected = createHmac('sha256', secret)
      .update(JSON.stringify(body))
      .digest('hex');

    if (signature !== `sha256=${expected}`) {
      throw new UnauthorizedException('Invalid signature');
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
