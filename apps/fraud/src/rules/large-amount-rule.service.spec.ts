import { ScoreRequest } from './base-rule.service';
jest.mock('../generated/prisma/client', () => ({ PrismaClient: class {} }));
jest.mock('@prisma/adapter-pg', () => ({ PrismaPg: class {} }));

import { LargeAmountRuleService } from './large-amount-rule.service';

const mockPrisma = {
  userTransferStats: { findUnique: jest.fn() },
};

function makeReq(overrides: Partial<ScoreRequest> = {}): ScoreRequest {
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

function makeStats(overrides: Record<string, any> = {}) {
  return {
    count: 10,
    sumCents: 100000, // mean = 10000
    sumSqCents: 1000000000, // E[x^2] = 100000000, variance = 0 (all exactly 10000)
    ...overrides,
  };
}

describe('LargeAmountRuleService', () => {
  let service: LargeAmountRuleService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new LargeAmountRuleService(mockPrisma as any);
  });

  it('does not fire when no stats exist for user', async () => {
    mockPrisma.userTransferStats.findUnique.mockResolvedValue(null);

    const result = await service.evaluate(makeReq());

    expect(result.fired).toBe(false);
  });

  it('does not fire when user has fewer than 5 transactions', async () => {
    mockPrisma.userTransferStats.findUnique.mockResolvedValue(
      makeStats({ count: 4 }),
    );

    const result = await service.evaluate(makeReq());

    expect(result.fired).toBe(false);
  });

  it('does not fire when amount is within 3 standard deviations', async () => {
    mockPrisma.userTransferStats.findUnique.mockResolvedValue(makeStats());

    const result = await service.evaluate(
      makeReq({ usdEquivalentCents: 10000 }),
    );

    expect(result.fired).toBe(false);
  });

  it('fires when amount exceeds mean + 3 stddev', async () => {
    mockPrisma.userTransferStats.findUnique.mockResolvedValue(makeStats());

    const result = await service.evaluate(
      makeReq({ usdEquivalentCents: 10001 }),
    );

    expect(result.fired).toBe(true);
    expect(result.score).toBe(60);
    expect(result.forceBlock).toBe(false);
    expect(result.name).toBe('large_amount_deviation');
  });

  it('uses amountCents as fallback when usdEquivalentCents is 0', async () => {
    mockPrisma.userTransferStats.findUnique.mockResolvedValue(makeStats());

    const result = await service.evaluate(
      makeReq({ usdEquivalentCents: 0, amountCents: 10001 }),
    );

    expect(result.fired).toBe(true);
  });
});
