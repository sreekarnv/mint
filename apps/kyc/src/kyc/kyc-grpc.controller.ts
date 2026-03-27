import { Controller } from '@nestjs/common';
import { KycService } from './kyc.service';
import { GrpcMethod } from '@nestjs/microservices';

@Controller()
export class KycGrpcController {
  constructor(private readonly kycService: KycService) {}

  @GrpcMethod('KycService', 'GetUserTier')
  async getUserTier({ userId }: { userId: string }) {
    return this.kycService.getTierCached(userId);
  }

  @GrpcMethod('KycService', 'GetLimits')
  async getLimits({ userId }: { userId: string }) {
    const { tier } = await this.kycService.getTierCached(userId);
    return KycService.getLimitsForTier(tier);
  }
}
