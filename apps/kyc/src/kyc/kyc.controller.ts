import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { KycService } from './kyc.service';
import type { Request } from 'express';
import { JWTAuthGuard } from '@mint/common';

@Controller('api/v1/kyc')
export class KycController {
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
}
