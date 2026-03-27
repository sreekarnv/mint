import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  KycStatus,
  KycTier,
  type KycProfile,
} from '../generated/prisma/client';
import { RedisService } from '@mint/common/services/redis.service';
import { ClientKafka } from '@nestjs/microservices';
import { v4 } from 'uuid';

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

const VALID_UPGRADES: Partial<Record<KycTier, KycTier>> = {
  UNVERIFIED: KycTier.BASIC,
  BASIC: KycTier.VERIFIED,
};

@Injectable()
export class KycService {
  private readonly logger: Logger = new Logger(KycService.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly prismaService: PrismaService,
    @Inject('KAFKA_PRODUCER') private readonly kafka: ClientKafka,
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

  async upgradeTier(userId: string, newTier: KycTier): Promise<void> {
    const profile = await this.getOrCreateProfile(userId);
    const current = profile.tier as KycTier;
    const allowed = VALID_UPGRADES[current];

    if (!allowed || allowed !== newTier) {
      throw new BadRequestException(
        `cannot upgrade from ${current} to ${newTier}`,
      );
    }

    await this.prismaService.kycProfile.update({
      where: { userId },
      data: {
        tier: newTier,
        ...(newTier === KycTier.VERIFIED
          ? {
              status: KycStatus.APPROVED,
              verifiedAt: new Date(),
            }
          : {}),
      },
    });

    await this.redisService.del(`kyc:tier:${userId}`);
    this.logger.log(`${userId}: ${current} => ${newTier}`);
    this.emit(
      `kyc.events`,
      { event: 'kyc.tier_upgraded', userId, previousTier: current, newTier },
      userId,
    );
  }

  async rejectProfile(userId: string, reason?: string): Promise<void> {
    await this.prismaService.kycProfile.update({
      where: { userId },
      data: {
        status: KycStatus.REJECTED,
        rejectionReason: reason ?? null,
      },
    });
    await this.redisService.del(`kyc:tier:${userId}`);

    this.emit(
      'kyc.events',
      { event: 'kyc.verification_failed', userId, reason },
      userId,
    );
  }

  private emit(
    topic: string,
    payload: Record<string, unknown>,
    actorId: string,
  ): void {
    this.kafka.emit(topic, {
      topic,
      eventId: v4(),
      timestamp: new Date().toISOString(),
      version: '1',
      service: 'kyc-service',
      actorId,
      payload,
    });
  }
}
