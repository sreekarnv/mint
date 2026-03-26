import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  KycStatus,
  KycTier,
  type KycProfile,
} from '../generated/prisma/client';
import { RedisService } from '@mint/common/services/redis.service';

export type TierCacheResult = {
  tier: KycTier;
  isFrozen: boolean;
};

export interface Limits {
  perTxnCents: number;
  dailyCents: number;
  monthlyCents: number;
  limitsCurrency: string;
}

const TIER_LIMITS: Record<KycTier, Limits> = {
  UNVERIFIED: {
    perTxnCents: 5_000,
    dailyCents: 10_000,
    monthlyCents: 20_000,
    limitsCurrency: 'USD',
  },
  BASIC: {
    perTxnCents: 50_000,
    dailyCents: 200_000,
    monthlyCents: 1_000_000,
    limitsCurrency: 'USD',
  },
  VERIFIED: {
    perTxnCents: 1_000_000,
    dailyCents: 5_000_000,
    monthlyCents: 20_000_000,
    limitsCurrency: 'USD',
  },
};

@Injectable()
export class KycService {
  constructor(
    private readonly redisService: RedisService,
    private readonly prismaService: PrismaService,
  ) {}

  static getLimitsForTier(tier: KycTier): Limits {
    return TIER_LIMITS[tier];
  }

  async getOrCreateProfile(userId: string): Promise<KycProfile> {
    let kycProfile = await this.prismaService.kycProfile.findUnique({
      where: { userId },
    });

    if (!kycProfile) {
      kycProfile = await this.prismaService.kycProfile.create({
        data: {
          userId,
        },
      });
    }

    return kycProfile;
  }

  async getTierCached(userId: string): Promise<TierCacheResult> {
    const tierCacheKey = `kyc:tier:${userId}`;
    const tierCache = await this.redisService.get(tierCacheKey);

    if (tierCache) return JSON.parse(tierCache) as TierCacheResult;

    const profile = await this.getOrCreateProfile(userId);
    const result: TierCacheResult = {
      tier: profile.tier as KycTier,
      isFrozen: profile.status === KycStatus.REJECTED,
    };

    await this.redisService.set(tierCacheKey, JSON.stringify(result), 300);
    return result;
  }

  async submitForReview(userId: string): Promise<void> {
    const profile = await this.getOrCreateProfile(userId);

    if (profile.tier !== KycTier.BASIC) {
      throw new BadRequestException(
        'Must be BASIC tier to submit for VERIFIED review',
      );
    }

    const kycDocs = await this.prismaService.kycDocument.findMany({
      where: { profileId: profile.id },
    });

    if (!kycDocs) {
      throw new BadRequestException('No documents uploaded');
    }

    await this.prismaService.kycProfile.update({
      where: {
        userId,
      },
      data: {
        status: KycStatus.PENDING_REVIEW,
        submittedAt: new Date(),
      },
    });
  }
}
