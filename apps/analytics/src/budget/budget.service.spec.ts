jest.mock(
  '../generated/prisma/enums',
  () => ({
    Category: {
      FOOD: 'FOOD',
      TRANSPORT: 'TRANSPORT',
      ENTERTAINMENT: 'ENTERTAINMENT',
      UTILITIES: 'UTILITIES',
      OTHER: 'OTHER',
    },
  }),
  { virtual: true },
);

jest.mock('../generated/prisma/client', () => ({ PrismaClient: class {} }), {
  virtual: true,
});
jest.mock('@prisma/adapter-pg', () => ({ PrismaPg: class {} }), {
  virtual: true,
});

import { BudgetService } from './budget.service';

const mockPrisma = {
  budget: { findUnique: jest.fn() },
};

const mockRedis = {
  incrby: jest.fn(),
  expire: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
};

const mockKafka = {
  emit: jest.fn(),
};

const USER_ID = 'user-1';
const CATEGORY = 'FOOD';

describe('BudgetService', () => {
  let service: BudgetService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BudgetService(
      mockPrisma as any,
      mockRedis as any,
      mockKafka as any,
    );
  });

  describe('checkThreshold', () => {
    it('does nothing when no budget exists for the category', async () => {
      mockPrisma.budget.findUnique.mockResolvedValue(null);

      await service.checkThreshold(USER_ID, CATEGORY as any, 1000);

      expect(mockRedis.incrby).not.toHaveBeenCalled();
      expect(mockKafka.emit).not.toHaveBeenCalled();
    });

    it('does nothing when budget exists but is inactive', async () => {
      mockPrisma.budget.findUnique.mockResolvedValue({
        id: 'b-1',
        limitCents: BigInt(10000),
        active: false,
      });

      await service.checkThreshold(USER_ID, CATEGORY as any, 1000);

      expect(mockRedis.incrby).not.toHaveBeenCalled();
    });

    it('increments spend counter and sets TTL on first spend of the month', async () => {
      mockPrisma.budget.findUnique.mockResolvedValue({
        id: 'b-1',
        limitCents: BigInt(10000),
        active: true,
      });
      mockRedis.incrby.mockResolvedValue(1000); // newTotal === amountCents => first spend
      mockRedis.get.mockResolvedValue(null);

      await service.checkThreshold(USER_ID, CATEGORY as any, 1000);

      expect(mockRedis.incrby).toHaveBeenCalled();
      expect(mockRedis.expire).toHaveBeenCalled();
    });

    it('does not set TTL on subsequent spends', async () => {
      mockPrisma.budget.findUnique.mockResolvedValue({
        id: 'b-1',
        limitCents: BigInt(10000),
        active: true,
      });
      mockRedis.incrby.mockResolvedValue(5000); // newTotal !== amountCents
      mockRedis.get.mockResolvedValue(null);

      await service.checkThreshold(USER_ID, CATEGORY as any, 1000);

      expect(mockRedis.expire).not.toHaveBeenCalled();
    });

    it('emits budget_warning at 80% threshold (first time)', async () => {
      mockPrisma.budget.findUnique.mockResolvedValue({
        id: 'b-1',
        limitCents: BigInt(10000),
        active: true,
      });
      mockRedis.incrby.mockResolvedValue(8000); // 80% of 10000
      mockRedis.get.mockResolvedValue(null);

      await service.checkThreshold(USER_ID, CATEGORY as any, 1000);

      expect(mockKafka.emit).toHaveBeenCalledWith(
        'analytics.events',
        expect.objectContaining({
          payload: expect.objectContaining({
            event: 'analytics.budget_warning',
            userId: USER_ID,
            category: CATEGORY,
            ratio: 0.8,
          }),
        }),
      );
    });

    it('does not re-emit budget_warning when already warned', async () => {
      mockPrisma.budget.findUnique.mockResolvedValue({
        id: 'b-1',
        limitCents: BigInt(10000),
        active: true,
      });
      mockRedis.incrby.mockResolvedValue(9000);
      mockRedis.get.mockImplementation((key: string) =>
        key.includes('warned80') ? '1' : null,
      );

      await service.checkThreshold(USER_ID, CATEGORY as any, 1000);

      const warningCall = mockKafka.emit.mock.calls.find(
        (c) => c[1]?.payload?.event === 'analytics.budget_warning',
      );
      expect(warningCall).toBeUndefined();
    });

    it('emits budget_exceeded at 100% threshold (first time)', async () => {
      mockPrisma.budget.findUnique.mockResolvedValue({
        id: 'b-1',
        limitCents: BigInt(10000),
        active: true,
      });
      mockRedis.incrby.mockResolvedValue(10000); // 100%
      mockRedis.get.mockResolvedValue(null);

      await service.checkThreshold(USER_ID, CATEGORY as any, 1000);

      expect(mockKafka.emit).toHaveBeenCalledWith(
        'analytics.events',
        expect.objectContaining({
          payload: expect.objectContaining({
            event: 'analytics.budget_exceeded',
            userId: USER_ID,
            category: CATEGORY,
          }),
        }),
      );
    });

    it('does not re-emit budget_exceeded when already warned', async () => {
      mockPrisma.budget.findUnique.mockResolvedValue({
        id: 'b-1',
        limitCents: BigInt(10000),
        active: true,
      });
      mockRedis.incrby.mockResolvedValue(12000);
      mockRedis.get.mockResolvedValue('1'); // both warned keys exist

      await service.checkThreshold(USER_ID, CATEGORY as any, 2000);

      expect(mockKafka.emit).not.toHaveBeenCalled();
    });
  });
});
