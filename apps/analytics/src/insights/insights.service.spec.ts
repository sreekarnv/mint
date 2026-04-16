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

import { InsightsService } from './insights.service';

const mockPrisma = {
  monthlyAggregate: { findMany: jest.fn() },
  spendEvent: { findMany: jest.fn() },
};

const USER_ID = 'user-1';

describe('InsightsService', () => {
  let service: InsightsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new InsightsService(mockPrisma as any);
  });

  describe('getMonthlyInsights', () => {
    it('returns aggregated category data with correct percentages', async () => {
      mockPrisma.monthlyAggregate.findMany.mockResolvedValue([
        { category: 'FOOD', totalCents: BigInt(6000), count: 3 },
        { category: 'TRANSPORT', totalCents: BigInt(4000), count: 2 },
      ]);

      const result = await service.getMonthlyInsights(USER_ID);

      expect(result.total).toBe(10000);
      expect(result.categories).toHaveLength(2);
      expect(result.categories[0]).toEqual({
        category: 'FOOD',
        total: 6000,
        count: 3,
        percentage: 60,
      });
      expect(result.categories[1]).toEqual({
        category: 'TRANSPORT',
        total: 4000,
        count: 2,
        percentage: 40,
      });
    });

    it('returns 0 total and empty categories when no aggregates exist', async () => {
      mockPrisma.monthlyAggregate.findMany.mockResolvedValue([]);

      const result = await service.getMonthlyInsights(USER_ID);

      expect(result.total).toBe(0);
      expect(result.categories).toEqual([]);
    });

    it('returns 0% when total is 0', async () => {
      mockPrisma.monthlyAggregate.findMany.mockResolvedValue([
        { category: 'FOOD', totalCents: BigInt(0), count: 0 },
      ]);

      const result = await service.getMonthlyInsights(USER_ID);

      expect(result.categories[0].percentage).toBe(0);
    });

    it('queries for the current year-month', async () => {
      mockPrisma.monthlyAggregate.findMany.mockResolvedValue([]);
      const yearMonth = new Date().toISOString().slice(0, 7);

      await service.getMonthlyInsights(USER_ID);

      expect(mockPrisma.monthlyAggregate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: USER_ID, yearMonth } }),
      );
    });
  });

  describe('getTopMerchants', () => {
    it('aggregates spend by merchant and returns sorted descending', async () => {
      mockPrisma.spendEvent.findMany.mockResolvedValue([
        { merchant: 'Starbucks', baseAmountCents: BigInt(500) },
        { merchant: 'Starbucks', baseAmountCents: BigInt(600) },
        { merchant: 'McDonalds', baseAmountCents: BigInt(300) },
      ]);

      const result = await service.getTopMerchants(USER_ID, 10);

      expect(result).toEqual([
        { merchant: 'Starbucks', total: 1100 },
        { merchant: 'McDonalds', total: 300 },
      ]);
    });

    it('respects the limit parameter', async () => {
      mockPrisma.spendEvent.findMany.mockResolvedValue([
        { merchant: 'A', baseAmountCents: BigInt(300) },
        { merchant: 'B', baseAmountCents: BigInt(200) },
        { merchant: 'C', baseAmountCents: BigInt(100) },
      ]);

      const result = await service.getTopMerchants(USER_ID, 2);

      expect(result).toHaveLength(2);
      expect(result[0].merchant).toBe('A');
    });

    it('returns empty array when no spend events exist', async () => {
      mockPrisma.spendEvent.findMany.mockResolvedValue([]);

      const result = await service.getTopMerchants(USER_ID);

      expect(result).toEqual([]);
    });
  });
});
