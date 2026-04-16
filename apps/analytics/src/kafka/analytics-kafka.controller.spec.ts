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

import { AnalyticsKafkaController } from './analytics-kafka.controller';

const mockPrisma = {
  spendEvent: { upsert: jest.fn() },
  monthlyAggregate: { upsert: jest.fn() },
};

const mockClassifier = {
  classify: jest.fn(),
};

const mockBudgetService = {
  checkThreshold: jest.fn(),
};

function makeEnvelope(payload: Record<string, any>) {
  return {
    payload: { event: 'transaction.completed', ...payload },
    timestamp: new Date().toISOString(),
  };
}

describe('AnalyticsKafkaController', () => {
  let controller: AnalyticsKafkaController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AnalyticsKafkaController(
      mockPrisma as any,
      mockClassifier as any,
      mockBudgetService as any,
    );
    mockClassifier.classify.mockReturnValue('FOOD');
    mockPrisma.spendEvent.upsert.mockResolvedValue({});
    mockPrisma.monthlyAggregate.upsert.mockResolvedValue({});
    mockBudgetService.checkThreshold.mockResolvedValue(undefined);
  });

  it('ignores non-completed events', async () => {
    await controller.handleTransactionEvents({
      payload: { event: 'transaction.created' },
    });

    expect(mockPrisma.spendEvent.upsert).not.toHaveBeenCalled();
  });

  it('ignores TOPUP transactions', async () => {
    await controller.handleTransactionEvents(
      makeEnvelope({ type: 'TOPUP', transactionId: 'tx-1', senderId: 'u-1' }),
    );

    expect(mockPrisma.spendEvent.upsert).not.toHaveBeenCalled();
  });

  it('processes a TRANSFER and writes spendEvent + monthlyAggregate', async () => {
    const envelope = makeEnvelope({
      type: 'TRANSFER',
      transactionId: 'tx-1',
      senderId: 'u-1',
      senderAmount: 5000,
      senderCurrency: 'USD',
      merchant: 'Starbucks',
      description: 'coffee',
      completedAt: new Date().toISOString(),
    });

    await controller.handleTransactionEvents(envelope);

    expect(mockClassifier.classify).toHaveBeenCalledWith('coffee', 'Starbucks');

    expect(mockPrisma.spendEvent.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { transactionId: 'tx-1' },
        create: expect.objectContaining({
          transactionId: 'tx-1',
          userId: 'u-1',
          category: 'FOOD',
          merchant: 'Starbucks',
        }),
      }),
    );

    expect(mockPrisma.monthlyAggregate.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId_yearMonth_category: expect.objectContaining({
            userId: 'u-1',
            category: 'FOOD',
          }),
        }),
      }),
    );
  });

  it('calls budget checkThreshold with the classified category and amount', async () => {
    const envelope = makeEnvelope({
      type: 'TRANSFER',
      transactionId: 'tx-2',
      senderId: 'u-1',
      senderAmount: 3000,
      completedAt: new Date().toISOString(),
    });

    await controller.handleTransactionEvents(envelope);

    expect(mockBudgetService.checkThreshold).toHaveBeenCalledWith(
      'u-1',
      'FOOD',
      3000,
    );
  });

  it('stores null merchant when merchant is absent', async () => {
    const envelope = makeEnvelope({
      type: 'TRANSFER',
      transactionId: 'tx-3',
      senderId: 'u-1',
      senderAmount: 2000,
      merchant: null,
      completedAt: new Date().toISOString(),
    });

    await controller.handleTransactionEvents(envelope);

    expect(mockPrisma.spendEvent.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ merchant: null }),
      }),
    );
  });

  it('does not throw when prisma upsert fails (swallows error)', async () => {
    mockPrisma.spendEvent.upsert.mockRejectedValue(new Error('DB error'));

    await expect(
      controller.handleTransactionEvents(
        makeEnvelope({
          type: 'TRANSFER',
          transactionId: 'tx-4',
          senderId: 'u-1',
          senderAmount: 1000,
        }),
      ),
    ).resolves.not.toThrow();
  });
});
