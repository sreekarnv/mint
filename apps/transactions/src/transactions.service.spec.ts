jest.mock(
  './generated/prisma/client',
  () => ({
    PrismaClient: class {},
    Prisma: {
      PrismaClientKnownRequestError: class PrismaClientKnownRequestError extends Error {
        code: string;
        constructor(message: string, { code }: { code: string }) {
          super(message);
          this.code = code;
        }
      },
    },
  }),
  { virtual: true },
);
jest.mock(
  './generated/prisma/enums',
  () => ({
    TxnStatus: {
      PENDING: 'PENDING',
      PROCESSING: 'PROCESSING',
      COMPLETED: 'COMPLETED',
      FAILED: 'FAILED',
      CANCELLED: 'CANCELLED',
      REVERSED: 'REVERSED',
    },
    TxnType: { TRANSFER: 'TRANSFER', TOPUP: 'TOPUP' },
  }),
  { virtual: true },
);
jest.mock('@prisma/adapter-pg', () => ({ PrismaPg: class {} }), {
  virtual: true,
});
jest.mock('@mint/common', () => ({
  getTraceHeaders: jest.fn(() => ({})),
  RedisService: class {},
}));

import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { of } from 'rxjs';
import { Prisma } from './generated/prisma/client';
import { TxnStatus, TxnType } from './generated/prisma/enums';
import { TransactionsService } from './transactions.service';

const mockPrisma = {
  transaction: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
};

const mockRedis = { sismember: jest.fn(), incrby: jest.fn() };
const mockLimitService = { checkAll: jest.fn(), recordTransaction: jest.fn() };
const mockStateMachine = { validateTransition: jest.fn() };
const mockKafka = { emit: jest.fn() };

const mockFraudClient = { ScoreTransaction: jest.fn() };
const mockKycClient = { GetLimits: jest.fn() };
const mockWalletClient = {
  GetWallet: jest.fn(),
  DebitWallet: jest.fn(),
  CreditWallet: jest.fn(),
};

const mockFraudGrpc = { getService: jest.fn(() => mockFraudClient) };
const mockKycGrpc = { getService: jest.fn(() => mockKycClient) };
const mockWalletGrpc = { getService: jest.fn(() => mockWalletClient) };

function makeTxn(overrides: Record<string, any> = {}) {
  return {
    id: 'txn-1',
    idempotencyKey: 'idem-1',
    type: TxnType.TRANSFER,
    status: TxnStatus.PENDING,
    senderId: 'u-1',
    recipientId: 'u-2',
    senderWallet: 'w-1',
    recipientWallet: 'w-2',
    senderAmount: BigInt(5000),
    senderCurrency: 'USD',
    recipientCurrency: 'USD',
    recipientAmount: null,
    description: null,
    merchant: null,
    category: null,
    fraudDecision: null,
    fraudScore: null,
    fxRate: null,
    fxRateLockedAt: null,
    processingAt: null,
    completedAt: null,
    createdAt: new Date(),
    ...overrides,
  };
}

const SENDER_WALLET = {
  id: 'w-1',
  userId: 'u-1',
  currency: 'USD',
  balance: 100000,
  status: 'ACTIVE',
  isDefault: true,
};
const RECIPIENT_WALLET = {
  id: 'w-2',
  userId: 'u-2',
  currency: 'USD',
  balance: 0,
  status: 'ACTIVE',
  isDefault: true,
};

describe('TransactionsService', () => {
  let service: TransactionsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TransactionsService(
      mockPrisma as any,
      mockRedis as any,
      mockLimitService as any,
      mockStateMachine as any,
      mockFraudGrpc as any,
      mockKycGrpc as any,
      mockWalletGrpc as any,
      mockKafka as any,
    );

    mockWalletClient.GetWallet.mockReturnValue(of(SENDER_WALLET));
    mockLimitService.checkAll.mockResolvedValue(undefined);
    mockLimitService.recordTransaction.mockResolvedValue(undefined);
    mockRedis.sismember.mockResolvedValue(0);
    mockFraudClient.ScoreTransaction.mockReturnValue(
      of({ decision: 'ALLOW', score: 10, rulesFired: [], reason: '' }),
    );
    mockWalletClient.DebitWallet.mockReturnValue(
      of({ success: true, balanceAfter: 95000 }),
    );
    mockWalletClient.CreditWallet.mockReturnValue(
      of({ success: true, balanceAfter: 5000 }),
    );
    mockPrisma.transaction.update.mockResolvedValue(
      makeTxn({ status: TxnStatus.COMPLETED, completedAt: new Date() }),
    );
  });


  describe('getTransaction', () => {
    it('throws BadRequestException when transaction not found', async () => {
      mockPrisma.transaction.findUnique.mockResolvedValue(null);

      await expect(service.getTransaction('txn-1', 'u-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws ForbiddenException when user is neither sender nor recipient', async () => {
      mockPrisma.transaction.findUnique.mockResolvedValue(makeTxn());

      await expect(service.getTransaction('txn-1', 'u-99')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('returns transaction for sender', async () => {
      const txn = makeTxn();
      mockPrisma.transaction.findUnique.mockResolvedValue(txn);

      const result = await service.getTransaction('txn-1', 'u-1');

      expect(result.id).toBe('txn-1');
      expect(result.amount).toBe(5000);
    });

    it('returns transaction for recipient', async () => {
      mockPrisma.transaction.findUnique.mockResolvedValue(makeTxn());

      const result = await service.getTransaction('txn-1', 'u-2');

      expect(result.id).toBe('txn-1');
    });
  });


  describe('listTransactions', () => {
    it('maps BigInt senderAmount to number', async () => {
      mockPrisma.transaction.findMany.mockResolvedValue([makeTxn()]);

      const result = await service.listTransactions('u-1');

      expect(result[0].amount).toBe(5000);
    });

    it('applies cursor filter when provided', async () => {
      mockPrisma.transaction.findMany.mockResolvedValue([]);

      await service.listTransactions('u-1', 10, 'cursor-abc');

      expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: { lt: 'cursor-abc' } }),
        }),
      );
    });

    it('defaults to limit=20', async () => {
      mockPrisma.transaction.findMany.mockResolvedValue([]);

      await service.listTransactions('u-1');

      expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 20 }),
      );
    });
  });


  describe('adminListTransactions', () => {
    it('applies userId filter when provided', async () => {
      mockPrisma.transaction.findMany.mockResolvedValue([]);

      await service.adminListTransactions({ limit: 10, userId: 'u-1' });

      expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [{ senderId: 'u-1' }, { recipientId: 'u-1' }],
          }),
        }),
      );
    });

    it('applies status filter when provided', async () => {
      mockPrisma.transaction.findMany.mockResolvedValue([]);

      await service.adminListTransactions({
        limit: 10,
        status: TxnStatus.COMPLETED,
      });

      expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: TxnStatus.COMPLETED }),
        }),
      );
    });

    it('omits filters when not provided', async () => {
      mockPrisma.transaction.findMany.mockResolvedValue([]);

      await service.adminListTransactions({ limit: 10 });

      const callArg = mockPrisma.transaction.findMany.mock.calls[0][0];
      expect(callArg.where).not.toHaveProperty('status');
      expect(callArg.where).not.toHaveProperty('OR');
    });
  });


  describe('topup', () => {
    const dto = { amount: 5000, currency: 'USD', description: 'Test topup' };

    beforeEach(() => {
      mockWalletClient.GetWallet.mockReturnValue(of(SENDER_WALLET));
    });

    it('creates transaction, credits wallet, and returns COMPLETED', async () => {
      const txn = makeTxn({ type: TxnType.TOPUP });
      mockPrisma.transaction.create.mockResolvedValue(txn);
      mockWalletClient.CreditWallet.mockReturnValue(
        of({ success: true, balanceAfter: 5000 }),
      );
      mockPrisma.transaction.update.mockResolvedValue({
        ...txn,
        status: TxnStatus.COMPLETED,
      });

      const result = await service.topup(dto, 'u-1', 'idem-1');

      expect(mockPrisma.transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: TxnType.TOPUP,
            status: TxnStatus.PENDING,
          }),
        }),
      );
      expect(result.status).toBe(TxnStatus.COMPLETED);
      expect(result.amount).toBe(5000);
    });

    it('marks transaction FAILED and throws when wallet credit fails', async () => {
      const txn = makeTxn({ type: TxnType.TOPUP });
      mockPrisma.transaction.create.mockResolvedValue(txn);
      mockWalletClient.CreditWallet.mockReturnValue(
        of({ success: false, error: 'Wallet frozen', balanceAfter: 0 }),
      );

      await expect(service.topup(dto, 'u-1', 'idem-1')).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrisma.transaction.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: TxnStatus.FAILED } }),
      );
    });

    it('returns existing transaction on idempotency key collision', async () => {
      const dupError = new Prisma.PrismaClientKnownRequestError('dup', {
        code: 'P2002',
      });
      mockPrisma.transaction.create.mockRejectedValue(dupError);

      const existing = makeTxn({ status: TxnStatus.COMPLETED });
      mockPrisma.transaction.findUnique.mockResolvedValue(existing);

      const result = await service.topup(dto, 'u-1', 'idem-1');

      expect(result.id).toBe('txn-1');
    });

    it('emits transaction.completed event after successful topup', async () => {
      const txn = makeTxn({ type: TxnType.TOPUP });
      mockPrisma.transaction.create.mockResolvedValue(txn);
      mockWalletClient.CreditWallet.mockReturnValue(
        of({ success: true, balanceAfter: 5000 }),
      );
      mockPrisma.transaction.update.mockResolvedValue({
        ...txn,
        status: TxnStatus.COMPLETED,
      });

      await service.topup(dto, 'u-1', 'idem-1');

      expect(mockKafka.emit).toHaveBeenCalledWith(
        'transaction.events',
        expect.objectContaining({
          value: expect.objectContaining({
            payload: expect.objectContaining({
              event: 'transaction.completed',
              type: TxnType.TOPUP,
            }),
          }),
        }),
      );
    });
  });


  describe('transfer', () => {
    const dto = {
      recipientId: 'u-2',
      amount: 5000,
      senderCurrency: 'USD',
      recipientCurrency: 'USD',
      description: null,
      merchant: null,
      category: null,
    };

    beforeEach(() => {
      mockWalletClient.GetWallet.mockReturnValueOnce(
        of(SENDER_WALLET),
      ).mockReturnValueOnce(of(RECIPIENT_WALLET));
      mockPrisma.transaction.create.mockResolvedValue(makeTxn());
    });

    it('completes transfer and emits transaction.completed', async () => {
      const completed = makeTxn({
        status: TxnStatus.COMPLETED,
        completedAt: new Date(),
      });
      mockPrisma.transaction.update
        .mockResolvedValueOnce(makeTxn({ status: TxnStatus.PROCESSING }))
        .mockResolvedValue(completed);

      const result = await service.transfer(dto, 'u-1', 'idem-1', '1.2.3.4');

      expect(result.status).toBe(TxnStatus.COMPLETED);
      expect(mockKafka.emit).toHaveBeenCalledWith(
        'transaction.events',
        expect.objectContaining({
          value: expect.objectContaining({
            payload: expect.objectContaining({
              event: 'transaction.completed',
            }),
          }),
        }),
      );
    });

    it('blocks transaction and throws ForbiddenException when fraud decision is BLOCK', async () => {
      mockFraudClient.ScoreTransaction.mockReturnValue(
        of({
          decision: 'BLOCK',
          score: 100,
          rulesFired: ['velocity'],
          reason: 'too fast',
        }),
      );
      mockPrisma.transaction.update.mockResolvedValue({});

      await expect(
        service.transfer(dto, 'u-1', 'idem-1', '1.2.3.4'),
      ).rejects.toThrow(ForbiddenException);

      expect(mockPrisma.transaction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: TxnStatus.FAILED,
            fraudDecision: 'BLOCK',
          }),
        }),
      );
      expect(mockKafka.emit).toHaveBeenCalledWith(
        'transaction.events',
        expect.objectContaining({
          value: expect.objectContaining({
            payload: expect.objectContaining({
              event: 'transaction.fraud_blocked',
            }),
          }),
        }),
      );
    });

    it('marks FAILED and throws BadRequestException when debit fails', async () => {
      mockWalletClient.DebitWallet.mockReturnValue(
        of({ success: false, error: 'Insufficient funds', balanceAfter: 0 }),
      );
      mockPrisma.transaction.update.mockResolvedValue({});

      await expect(
        service.transfer(dto, 'u-1', 'idem-1', '1.2.3.4'),
      ).rejects.toThrow('Insufficient funds');
      expect(mockPrisma.transaction.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: TxnStatus.FAILED } }),
      );
    });

    it('throws when limit check fails', async () => {
      mockLimitService.checkAll.mockRejectedValue(
        new BadRequestException('Daily limit exceeded'),
      );

      await expect(
        service.transfer(dto, 'u-1', 'idem-1', '1.2.3.4'),
      ).rejects.toThrow('Daily limit exceeded');
    });

    it('returns existing transaction on idempotency key collision', async () => {
      const dupError = new Prisma.PrismaClientKnownRequestError('dup', {
        code: 'P2002',
      });
      mockPrisma.transaction.create.mockRejectedValue(dupError);

      const existing = makeTxn({ status: TxnStatus.COMPLETED });
      mockPrisma.transaction.findUnique.mockResolvedValue(existing);

      const result = await service.transfer(dto, 'u-1', 'idem-1', '1.2.3.4');

      expect(result.id).toBe('txn-1');
      expect(result.status).toBe(TxnStatus.COMPLETED);
    });
  });
});
