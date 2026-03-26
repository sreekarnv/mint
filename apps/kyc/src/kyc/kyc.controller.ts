import { Controller, Get, Req, UseGuards } from '@nestjs/common';
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
}
