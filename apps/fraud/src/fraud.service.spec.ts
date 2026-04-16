jest.mock('./generated/prisma/client', () => ({ PrismaClient: class {} }));
jest.mock('@prisma/adapter-pg', () => ({ PrismaPg: class {} }));
jest.mock('geoip-lite', () => ({ lookup: jest.fn() }));

import { FraudService } from './fraud.service';

const mockPrisma = {
  fraudCase: {
    upsert: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  userTransferStats: {
    upsert: jest.fn(),
  },
};

const mockDecisionEngine = { decide: jest.fn() };

function makeRule(name: string) {
  return { evaluate: jest.fn() };
}

const mockVelocity = makeRule('velocity');
const mockLargeAmount = makeRule('large_amount');
const mockNewRecipient = makeRule('new_recipient');
const mockGeoAnomaly = makeRule('geo_anomaly');
const mockNightLarge = makeRule('night_large');
const mockSanctioned = makeRule('sanctioned');

function makeScoreReq(overrides: Record<string, any> = {}) {
  return {
    transactionId: 'tx-1',
    userId: 'u-1',
    recipientId: 'u-2',
    amountCents: 5000,
    currency: 'USD',
    ipAddress: '1.2.3.4',
    transactionType: 'TRANSFER',
    userCountry: 'US',
    recipientIsContact: false,
    senderCurrency: 'USD',
    recipientCurrency: 'USD',
    usdEquivalentCents: 5000,
    ...overrides,
  };
}

describe('FraudService', () => {
  let service: FraudService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new FraudService(
      mockPrisma as any,
      mockDecisionEngine as any,
      mockVelocity as any,
      mockLargeAmount as any,
      mockNewRecipient as any,
      mockGeoAnomaly as any,
      mockNightLarge as any,
      mockSanctioned as any,
    );
  });


  describe('evaluate', () => {
    it('calls all six rules and returns the decision engine result', async () => {
      const ruleResult = {
        fired: false,
        score: 0,
        forceBlock: false,
        name: 'r',
        reason: '',
      };
      for (const rule of [
        mockVelocity,
        mockLargeAmount,
        mockNewRecipient,
        mockGeoAnomaly,
        mockNightLarge,
        mockSanctioned,
      ]) {
        rule.evaluate.mockResolvedValue(ruleResult);
      }
      const decision = {
        decision: 'ALLOW',
        score: 0,
        rulesFired: [],
        reason: '',
      };
      mockDecisionEngine.decide.mockReturnValue(decision);
      mockPrisma.fraudCase.upsert.mockResolvedValue({});

      const result = await service.evalute(makeScoreReq());

      expect(mockVelocity.evaluate).toHaveBeenCalledTimes(1);
      expect(mockLargeAmount.evaluate).toHaveBeenCalledTimes(1);
      expect(mockNewRecipient.evaluate).toHaveBeenCalledTimes(1);
      expect(mockGeoAnomaly.evaluate).toHaveBeenCalledTimes(1);
      expect(mockNightLarge.evaluate).toHaveBeenCalledTimes(1);
      expect(mockSanctioned.evaluate).toHaveBeenCalledTimes(1);
      expect(result).toEqual(decision);
    });

    it('upserts fraud case with decision data', async () => {
      const ruleResult = {
        fired: false,
        score: 0,
        forceBlock: false,
        name: 'r',
        reason: '',
      };
      for (const rule of [
        mockVelocity,
        mockLargeAmount,
        mockNewRecipient,
        mockGeoAnomaly,
        mockNightLarge,
        mockSanctioned,
      ]) {
        rule.evaluate.mockResolvedValue(ruleResult);
      }
      mockDecisionEngine.decide.mockReturnValue({
        decision: 'BLOCK',
        score: 100,
        rulesFired: ['velocity_breach'],
        reason: 'too fast',
      });
      mockPrisma.fraudCase.upsert.mockResolvedValue({});

      await service.evalute(makeScoreReq());

      expect(mockPrisma.fraudCase.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { transactionId: 'tx-1' },
          create: expect.objectContaining({
            transactionId: 'tx-1',
            userId: 'u-1',
            decision: 'BLOCK',
            score: 100,
          }),
        }),
      );
    });
  });


  describe('listReviewQueue', () => {
    it('returns paginated REVIEW cases with correct shape', async () => {
      const createdAt = new Date('2025-01-01T00:00:00Z');
      mockPrisma.fraudCase.findMany.mockResolvedValue([
        {
          id: 'case-1',
          transactionId: 'tx-1',
          userId: 'u-1',
          score: 75,
          rulesFired: ['new_recipient'],
          createdAt,
        },
      ]);
      mockPrisma.fraudCase.count.mockResolvedValue(1);

      const result = await service.listReviewQueue(10, 0);

      expect(result.total).toBe(1);
      expect(result.items[0]).toEqual({
        caseId: 'case-1',
        transactionId: 'tx-1',
        userId: 'u-1',
        score: 75,
        rulesFired: ['new_recipient'],
        createdAt: createdAt.toISOString(),
      });
    });

    it('passes limit and offset to prisma', async () => {
      mockPrisma.fraudCase.findMany.mockResolvedValue([]);
      mockPrisma.fraudCase.count.mockResolvedValue(0);

      await service.listReviewQueue(5, 20);

      expect(mockPrisma.fraudCase.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
          skip: 20,
          where: { decision: 'REVIEW' },
        }),
      );
    });
  });


  describe('updateUserStats', () => {
    it('upserts with correct create payload on first transaction', async () => {
      mockPrisma.userTransferStats.upsert.mockResolvedValue({});

      await service.updateUserStats('u-1', 10000);

      expect(mockPrisma.userTransferStats.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'u-1' },
          create: {
            userId: 'u-1',
            count: 1,
            sumCents: 10000,
            sumSqCents: 100000000,
          },
        }),
      );
    });

    it('increments stats on subsequent transactions', async () => {
      mockPrisma.userTransferStats.upsert.mockResolvedValue({});

      await service.updateUserStats('u-1', 10000);

      expect(mockPrisma.userTransferStats.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            count: { increment: 1 },
            sumCents: { increment: 10000 },
            sumSqCents: { increment: 100000000 },
          }),
        }),
      );
    });
  });
});
