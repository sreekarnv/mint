jest.mock('./generated/prisma/client', () => ({ PrismaClient: class {} }), {
  virtual: true,
});
jest.mock('@prisma/adapter-pg', () => ({ PrismaPg: class {} }), {
  virtual: true,
});
jest.mock('./generated/prisma/internal/prismaNamespace', () => ({}), {
  virtual: true,
});
jest.mock('./generated/prisma/models', () => ({}), { virtual: true });

import { AuditService } from './audit.service';

const mockPrisma = {
  auditLog: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
};

function makeEnvelope(overrides: Record<string, any> = {}) {
  return {
    eventId: 'evt-1',
    topic: 'transaction.events',
    actorId: 'user-1',
    service: 'transactions-service',
    timestamp: new Date().toISOString(),
    traceId: 'trace-1',
    payload: { event: 'transaction.completed', transactionId: 'tx-1' },
    ...overrides,
  };
}

describe('AuditService', () => {
  let service: AuditService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuditService(mockPrisma as any);
  });

  describe('appendEntry', () => {
    it('persists a correctly shaped audit log entry', async () => {
      mockPrisma.auditLog.create.mockResolvedValue({});

      await service.appendEntry(makeEnvelope());

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventId: 'evt-1',
          topic: 'transaction.events',
          actorId: 'user-1',
          action: 'transaction.completed',
          resourceType: 'transaction',
          resourceId: 'tx-1',
          traceId: 'trace-1',
        }),
      });
    });

    it('falls back to topic as action when payload has no event field', async () => {
      mockPrisma.auditLog.create.mockResolvedValue({});

      await service.appendEntry(makeEnvelope({ payload: {} }));

      const { action } = mockPrisma.auditLog.create.mock.calls[0][0].data;
      expect(action).toBe('transaction.events');
    });

    it('derives service from topic when service field is absent', async () => {
      mockPrisma.auditLog.create.mockResolvedValue({});
      const envelope = makeEnvelope();
      // @ts-ignore
      delete envelope.service;

      await service.appendEntry(envelope);

      const { service: svc } = mockPrisma.auditLog.create.mock.calls[0][0].data;
      expect(svc).toBe('transaction-service');
    });

    it('does not throw when prisma create fails (swallows error)', async () => {
      mockPrisma.auditLog.create.mockRejectedValue(new Error('DB down'));

      await expect(service.appendEntry(makeEnvelope())).resolves.not.toThrow();
    });
  });

  describe('deriveResourceType', () => {
    it.each([
      ['auth.events', 'user'],
      ['wallet.events', 'wallet'],
      ['transaction.events', 'transaction'],
      ['kyc.events', 'kyc_profile'],
      ['social.events', 'social'],
      ['analytics.events', 'budget'],
      ['webhook.events', 'webhook'],
      ['admin.events', 'admin_action'],
    ])('maps topic "%s" to resourceType "%s"', async (topic, expectedType) => {
      mockPrisma.auditLog.create.mockResolvedValue({});

      await service.appendEntry(makeEnvelope({ topic, payload: {} }));

      const { resourceType } = mockPrisma.auditLog.create.mock.calls[0][0].data;
      expect(resourceType).toBe(expectedType);
    });

    it('returns null for unknown topics', async () => {
      mockPrisma.auditLog.create.mockResolvedValue({});

      await service.appendEntry(
        makeEnvelope({ topic: 'unknown.events', payload: {} }),
      );

      const { resourceType } = mockPrisma.auditLog.create.mock.calls[0][0].data;
      expect(resourceType).toBeNull();
    });
  });

  describe('deriveResourceId', () => {
    it.each([
      [{ transactionId: 'tx-1' }, 'tx-1'],
      [{ userId: 'u-1' }, 'u-1'],
      [{ walletId: 'w-1' }, 'w-1'],
      [{ profileId: 'p-1' }, 'p-1'],
      [{ requestId: 'r-1' }, 'r-1'],
      [{ splitId: 's-1' }, 's-1'],
      [{}, null],
    ])('payload %j → resourceId "%s"', async (payload, expectedId) => {
      mockPrisma.auditLog.create.mockResolvedValue({});

      await service.appendEntry(makeEnvelope({ payload }));

      const { resourceId } = mockPrisma.auditLog.create.mock.calls[0][0].data;
      expect(resourceId).toBe(expectedId);
    });
  });

  describe('queryLog', () => {
    beforeEach(() => {
      mockPrisma.auditLog.findMany.mockResolvedValue([
        { id: BigInt(1), action: 'tx.completed', createdAt: new Date() },
      ]);
      mockPrisma.auditLog.count.mockResolvedValue(1);
    });

    it('returns paginated result with correct metadata', async () => {
      const result = await service.queryLog({ page: 1, pageSize: 10 });

      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(result.entries).toHaveLength(1);
    });

    it('defaults to page 1 and pageSize 50', async () => {
      await service.queryLog({});

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 50, skip: 0 }),
      );
    });

    it('applies actorId and action filters', async () => {
      await service.queryLog({ actorId: 'u-1', action: 'tx.completed' });

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            actorId: 'u-1',
            action: 'tx.completed',
          }),
        }),
      );
    });

    it('applies date range filter when both dates provided', async () => {
      const start = new Date('2025-01-01');
      const end = new Date('2025-01-31');

      await service.queryLog({ startDate: start, endDate: end });

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: { gte: start, lte: end },
          }),
        }),
      );
    });

    it('serializes BigInt id to string', async () => {
      const result = await service.queryLog({});

      expect(typeof result.entries[0].id).toBe('string');
      expect(result.entries[0].id).toBe('1');
    });

    it('calculates totalPages correctly for multi-page results', async () => {
      mockPrisma.auditLog.count.mockResolvedValue(105);

      const result = await service.queryLog({ pageSize: 10 });

      expect(result.totalPages).toBe(11);
    });
  });
});
