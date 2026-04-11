import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { KycStatus } from '../generated/prisma/client';
import { KycService } from './kyc.service';

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

  @GrpcMethod('KycService', 'GetProfile')
  async getProfile({ userId }: { userId: string }) {
    const profile = await this.kycService.getOrCreateProfile(userId);
    return {
      profileId: profile.id,
      tier: profile.tier,
      status: profile.status,
      isFrozen: profile.status === KycStatus.REJECTED,
      submittedAt: profile.submittedAt?.toISOString() ?? '',
      rejectionReason: profile.rejectionReason ?? '',
      documents: (profile.kycDocuments ?? []).map((d) => ({
        id: d.id,
        type: d.type,
        status: d.status,
        uploadedAt: d.uploadedAt.toISOString(),
        docName: d.docName ?? '',
      })),
    };
  }

  @GrpcMethod('KycService', 'ListPendingQueue')
  async listPendingQueue({
    limit = 50,
    offset = 0,
  }: {
    limit?: number;
    offset?: number;
  }) {
    return this.kycService.listPendingQueue(limit, offset);
  }
}
