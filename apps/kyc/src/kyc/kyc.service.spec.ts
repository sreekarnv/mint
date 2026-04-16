jest.mock(
  '../generated/prisma/client',
  () => ({
    PrismaClient: class {},
    KycTier: { UNVERIFIED: 'UNVERIFIED', BASIC: 'BASIC', VERIFIED: 'VERIFIED' },
    KycStatus: {
      APPROVED: 'APPROVED',
      PENDING_REVIEW: 'PENDING_REVIEW',
      REJECTED: 'REJECTED',
    },
    DocType: {
      PASSPORT: 'PASSPORT',
      DRIVERS_LICENSE: 'DRIVERS_LICENSE',
      SELFIE: 'SELFIE',
    },
  }),
  { virtual: true },
);
jest.mock('@prisma/adapter-pg', () => ({ PrismaPg: class {} }), {
  virtual: true,
});

import { BadRequestException } from '@nestjs/common';
import { DocType, KycStatus, KycTier } from '../generated/prisma/client';
import { KycService } from './kyc.service';

const mockPrisma = {
  kycProfile: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
  },
};

const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
};

const mockKafka = { emit: jest.fn() };

function makeProfile(overrides: Record<string, any> = {}) {
  return {
    id: 'prof-1',
    userId: 'u-1',
    tier: KycTier.UNVERIFIED,
    status: KycStatus.APPROVED,
    submittedAt: null,
    kycDocuments: [],
    ...overrides,
  };
}

describe('KycService', () => {
  let service: KycService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new KycService(
      mockRedis as any,
      mockPrisma as any,
      mockKafka as any,
    );
  });

  // ─── getLimitsForTier ───────────────────────────────────────────────────────

  describe('getLimitsForTier', () => {
    it.each([
      [KycTier.UNVERIFIED, 5_000, 10_000, 20_000],
      [KycTier.BASIC, 50_000, 200_000, 1_000_000],
      [KycTier.VERIFIED, 1_000_000, 5_000_000, 20_000_000],
    ])('%s returns correct limits', (tier, perTxn, daily, monthly) => {
      const limits = KycService.getLimitsForTier(tier);
      expect(limits.perTxnCents).toBe(perTxn);
      expect(limits.dailyCents).toBe(daily);
      expect(limits.monthlyCents).toBe(monthly);
      expect(limits.limitsCurrency).toBe('USD');
    });
  });

  // ─── getOrCreateProfile ─────────────────────────────────────────────────────

  describe('getOrCreateProfile', () => {
    it('returns existing profile when found', async () => {
      const profile = makeProfile();
      mockPrisma.kycProfile.findUnique.mockResolvedValue(profile);

      const result = await service.getOrCreateProfile('u-1');

      expect(result).toEqual(profile);
      expect(mockPrisma.kycProfile.create).not.toHaveBeenCalled();
    });

    it('creates a new profile when none exists', async () => {
      const profile = makeProfile();
      mockPrisma.kycProfile.findUnique.mockResolvedValue(null);
      mockPrisma.kycProfile.create.mockResolvedValue(profile);

      const result = await service.getOrCreateProfile('u-1');

      expect(mockPrisma.kycProfile.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: { userId: 'u-1' } }),
      );
      expect(result).toEqual(profile);
    });
  });

  // ─── getTierCached ──────────────────────────────────────────────────────────

  describe('getTierCached', () => {
    it('returns cached tier when Redis hit', async () => {
      mockRedis.get.mockResolvedValue(
        JSON.stringify({ tier: KycTier.BASIC, isFrozen: false }),
      );

      const result = await service.getTierCached('u-1');

      expect(result).toEqual({ tier: KycTier.BASIC, isFrozen: false });
      expect(mockPrisma.kycProfile.findUnique).not.toHaveBeenCalled();
    });

    it('queries DB and caches result on Redis miss', async () => {
      mockRedis.get.mockResolvedValue(null);
      const profile = makeProfile({
        tier: KycTier.BASIC,
        status: KycStatus.APPROVED,
      });
      mockPrisma.kycProfile.findUnique.mockResolvedValue(profile);
      mockPrisma.kycProfile.create.mockResolvedValue(profile);

      const result = await service.getTierCached('u-1');

      expect(result.tier).toBe(KycTier.BASIC);
      expect(result.isFrozen).toBe(false);
      expect(mockRedis.set).toHaveBeenCalledWith(
        'kyc:tier:u-1',
        expect.any(String),
        300,
      );
    });

    it('marks isFrozen=true when profile status is REJECTED', async () => {
      mockRedis.get.mockResolvedValue(null);
      const profile = makeProfile({ status: KycStatus.REJECTED });
      mockPrisma.kycProfile.findUnique.mockResolvedValue(profile);

      const result = await service.getTierCached('u-1');

      expect(result.isFrozen).toBe(true);
    });
  });

  // ─── submitForReview ────────────────────────────────────────────────────────

  describe('submitForReview', () => {
    it('throws if profile is not BASIC tier', async () => {
      mockPrisma.kycProfile.findUnique.mockResolvedValue(
        makeProfile({ tier: KycTier.UNVERIFIED }),
      );

      await expect(service.submitForReview('u-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws if already under review', async () => {
      mockPrisma.kycProfile.findUnique.mockResolvedValue(
        makeProfile({ tier: KycTier.BASIC, status: KycStatus.PENDING_REVIEW }),
      );

      await expect(service.submitForReview('u-1')).rejects.toThrow(
        'Already under review',
      );
    });

    it('throws if SELFIE document is missing', async () => {
      mockPrisma.kycProfile.findUnique.mockResolvedValue(
        makeProfile({
          tier: KycTier.BASIC,
          kycDocuments: [{ type: DocType.PASSPORT }],
        }),
      );

      await expect(service.submitForReview('u-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws if ID document (PASSPORT or DRIVERS_LICENSE) is missing', async () => {
      mockPrisma.kycProfile.findUnique.mockResolvedValue(
        makeProfile({
          tier: KycTier.BASIC,
          kycDocuments: [{ type: DocType.SELFIE }],
        }),
      );

      await expect(service.submitForReview('u-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('sets status to PENDING_REVIEW when all required docs are present', async () => {
      mockPrisma.kycProfile.findUnique.mockResolvedValue(
        makeProfile({
          tier: KycTier.BASIC,
          kycDocuments: [{ type: DocType.PASSPORT }, { type: DocType.SELFIE }],
        }),
      );
      mockPrisma.kycProfile.update.mockResolvedValue({});

      await service.submitForReview('u-1');

      expect(mockPrisma.kycProfile.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'u-1' },
          data: expect.objectContaining({ status: KycStatus.PENDING_REVIEW }),
        }),
      );
    });

    it('accepts DRIVERS_LICENSE as a valid ID document', async () => {
      mockPrisma.kycProfile.findUnique.mockResolvedValue(
        makeProfile({
          tier: KycTier.BASIC,
          kycDocuments: [
            { type: DocType.DRIVERS_LICENSE },
            { type: DocType.SELFIE },
          ],
        }),
      );
      mockPrisma.kycProfile.update.mockResolvedValue({});

      await expect(service.submitForReview('u-1')).resolves.not.toThrow();
    });
  });

  // ─── upgradeTier ────────────────────────────────────────────────────────────

  describe('upgradeTier', () => {
    it('throws for invalid upgrade path', async () => {
      mockPrisma.kycProfile.findUnique.mockResolvedValue(
        makeProfile({ tier: KycTier.VERIFIED }),
      );

      await expect(service.upgradeTier('u-1', KycTier.BASIC)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('emits kyc.tier_upgraded and clears cache on successful upgrade', async () => {
      mockPrisma.kycProfile.findUnique.mockResolvedValue(
        makeProfile({ tier: KycTier.UNVERIFIED }),
      );
      mockPrisma.kycProfile.updateMany.mockResolvedValue({ count: 1 });

      await service.upgradeTier('u-1', KycTier.BASIC);

      expect(mockPrisma.kycProfile.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'u-1', tier: KycTier.UNVERIFIED },
          data: expect.objectContaining({ tier: KycTier.BASIC }),
        }),
      );
      expect(mockRedis.del).toHaveBeenCalledWith('kyc:tier:u-1');
      expect(mockKafka.emit).toHaveBeenCalledWith(
        'kyc.events',
        expect.objectContaining({
          payload: expect.objectContaining({
            event: 'kyc.tier_upgraded',
            userId: 'u-1',
            previousTier: KycTier.UNVERIFIED,
            newTier: KycTier.BASIC,
          }),
        }),
      );
    });

    it('sets verifiedAt and APPROVED status when upgrading to VERIFIED', async () => {
      mockPrisma.kycProfile.findUnique.mockResolvedValue(
        makeProfile({ tier: KycTier.BASIC }),
      );
      mockPrisma.kycProfile.updateMany.mockResolvedValue({ count: 1 });

      await service.upgradeTier('u-1', KycTier.VERIFIED);

      expect(mockPrisma.kycProfile.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tier: KycTier.VERIFIED,
            status: KycStatus.APPROVED,
            verifiedAt: expect.any(Date),
          }),
        }),
      );
    });

    it('is a no-op when updateMany returns count=0 (concurrent upgrade)', async () => {
      mockPrisma.kycProfile.findUnique.mockResolvedValue(
        makeProfile({ tier: KycTier.UNVERIFIED }),
      );
      mockPrisma.kycProfile.updateMany.mockResolvedValue({ count: 0 });

      await service.upgradeTier('u-1', KycTier.BASIC);

      expect(mockRedis.del).not.toHaveBeenCalled();
      expect(mockKafka.emit).not.toHaveBeenCalled();
    });
  });

  // ─── listPendingQueue ───────────────────────────────────────────────────────

  describe('listPendingQueue', () => {
    it('returns paginated items with correct shape', async () => {
      const submittedAt = new Date('2025-06-01T12:00:00Z');
      mockPrisma.kycProfile.findMany.mockResolvedValue([
        { id: 'prof-1', userId: 'u-1', tier: KycTier.BASIC, submittedAt },
      ]);
      mockPrisma.kycProfile.count.mockResolvedValue(1);

      const result = await service.listPendingQueue(10, 0);

      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toEqual({
        profileId: 'prof-1',
        userId: 'u-1',
        tier: KycTier.BASIC,
        submittedAt: submittedAt.toISOString(),
      });
    });

    it('passes limit and offset to prisma', async () => {
      mockPrisma.kycProfile.findMany.mockResolvedValue([]);
      mockPrisma.kycProfile.count.mockResolvedValue(0);

      await service.listPendingQueue(5, 20);

      expect(mockPrisma.kycProfile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5, skip: 20 }),
      );
    });

    it('returns empty string for null submittedAt', async () => {
      mockPrisma.kycProfile.findMany.mockResolvedValue([
        {
          id: 'prof-2',
          userId: 'u-2',
          tier: KycTier.UNVERIFIED,
          submittedAt: null,
        },
      ]);
      mockPrisma.kycProfile.count.mockResolvedValue(1);

      const result = await service.listPendingQueue(10, 0);

      expect(result.items[0].submittedAt).toBe('');
    });
  });

  // ─── rejectProfile ──────────────────────────────────────────────────────────

  describe('rejectProfile', () => {
    it('updates status to REJECTED with reason and clears cache', async () => {
      mockPrisma.kycProfile.update.mockResolvedValue({});

      await service.rejectProfile('u-1', 'Blurry document');

      expect(mockPrisma.kycProfile.update).toHaveBeenCalledWith({
        where: { userId: 'u-1' },
        data: {
          status: KycStatus.REJECTED,
          rejectionReason: 'Blurry document',
        },
      });
      expect(mockRedis.del).toHaveBeenCalledWith('kyc:tier:u-1');
    });

    it('emits kyc.verification_failed event', async () => {
      mockPrisma.kycProfile.update.mockResolvedValue({});

      await service.rejectProfile('u-1', 'Expired ID');

      expect(mockKafka.emit).toHaveBeenCalledWith(
        'kyc.events',
        expect.objectContaining({
          payload: expect.objectContaining({
            event: 'kyc.verification_failed',
            userId: 'u-1',
            reason: 'Expired ID',
          }),
        }),
      );
    });

    it('sets rejectionReason to null when no reason provided', async () => {
      mockPrisma.kycProfile.update.mockResolvedValue({});

      await service.rejectProfile('u-1');

      expect(mockPrisma.kycProfile.update).toHaveBeenCalledWith({
        where: { userId: 'u-1' },
        data: { status: KycStatus.REJECTED, rejectionReason: null },
      });
    });
  });
});
