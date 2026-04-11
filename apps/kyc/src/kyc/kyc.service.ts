import { RedisService } from '@mint/common';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { v4 } from 'uuid';
import {
  DocType,
  KycStatus,
  KycTier,
  type KycProfile,
  type KycDocument,
} from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

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

// Required document types for each tier upgrade submission
const REQUIRED_DOCS_FOR_SUBMISSION: Partial<Record<KycTier, DocType[][]>> = {
  // BASIC tier submitting for VERIFIED: needs one ID doc AND a selfie
  BASIC: [
    [DocType.PASSPORT, DocType.DRIVERS_LICENSE], // at least one of these
    [DocType.SELFIE],                             // always required
  ],
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

  async getProfileById(profileId: string): Promise<KycProfile | null> {
    return await this.prismaService.kycProfile.findUnique({
      where: { id: profileId },
    });
  }

  async getOrCreateProfile(userId: string) {
    const existing = await this.prismaService.kycProfile.findUnique({
      where: { userId },
      include: { kycDocuments: true },
    });

    if (existing) return existing;

    return this.prismaService.kycProfile.create({
      data: { userId },
      include: { kycDocuments: true },
    });
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

    if (profile.status === KycStatus.PENDING_REVIEW) {
      throw new BadRequestException('Already under review');
    }

    const uploadedTypes = new Set(
      profile.kycDocuments.map((d) => d.type as DocType),
    );

    // Validate that all required document groups are satisfied
    const required = REQUIRED_DOCS_FOR_SUBMISSION[KycTier.BASIC] ?? [];
    for (const group of required) {
      const satisfied = group.some((t) => uploadedTypes.has(t));
      if (!satisfied) {
        throw new BadRequestException(
          `Missing required document: ${group.join(' or ')}`,
        );
      }
    }

    await this.prismaService.kycProfile.update({
      where: { userId },
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

    // Atomic conditional update — only updates if still at `current` tier,
    // preventing duplicate Kafka deliveries from racing into double-upgrade.
    const { count } = await this.prismaService.kycProfile.updateMany({
      where: { userId, tier: current },
      data: {
        tier: newTier,
        ...(newTier === KycTier.VERIFIED
          ? { status: KycStatus.APPROVED, verifiedAt: new Date() }
          : { status: KycStatus.APPROVED }),
      },
    });

    if (count === 0) {
      // Either already upgraded by a concurrent event or tier mismatch — safe to skip
      this.logger.warn(
        `upgradeTier no-op for ${userId}: already at ${newTier} or concurrent update`,
      );
      return;
    }

    await this.redisService.del(`kyc:tier:${userId}`);
    this.logger.log(`${userId}: ${current} => ${newTier}`);
    this.emit(
      'kyc.events',
      { event: 'kyc.tier_upgraded', userId, previousTier: current, newTier },
      userId,
    );
  }

  async listPendingQueue(limit: number, offset: number) {
    const [items, total] = await Promise.all([
      this.prismaService.kycProfile.findMany({
        where: { status: KycStatus.PENDING_REVIEW },
        orderBy: { submittedAt: 'asc' },
        take: limit,
        skip: offset,
      }),
      this.prismaService.kycProfile.count({
        where: { status: KycStatus.PENDING_REVIEW },
      }),
    ]);

    return {
      items: items.map((p) => ({
        profileId: p.id,
        userId: p.userId,
        tier: p.tier,
        submittedAt: p.submittedAt?.toISOString() ?? '',
      })),
      total,
    };
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
