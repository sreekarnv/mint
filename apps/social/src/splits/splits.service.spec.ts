jest.mock('../generated/prisma/client', () => ({ PrismaClient: class {} }), {
  virtual: true,
});
jest.mock(
  '../generated/prisma/enums',
  () => ({
    SplitStatus: { OPEN: 'OPEN', SETTLED: 'SETTLED' },
    ParticipantStatus: { PENDING: 'PENDING', PAID: 'PAID' },
  }),
  { virtual: true },
);
jest.mock('@prisma/adapter-pg', () => ({ PrismaPg: class {} }), {
  virtual: true,
});

import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ParticipantStatus, SplitStatus } from '../generated/prisma/enums';
import { SplitsService } from './splits.service';

const mockPrisma = {
  billSplit: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  splitParticipant: {
    update: jest.fn(),
    findMany: jest.fn(),
  },
};

const mockKafka = { emit: jest.fn() };

function makeSplit(overrides: Record<string, any> = {}) {
  return {
    id: 'split-1',
    creatorId: 'u-1',
    title: 'Dinner',
    totalCents: BigInt(6000),
    currency: 'USD',
    status: SplitStatus.OPEN,
    settledAt: null,
    createdAt: new Date(),
    participants: [
      {
        id: 'part-1',
        userId: 'u-1',
        amountCents: BigInt(3000),
        status: ParticipantStatus.PENDING,
        transactionId: null,
        paidAt: null,
      },
      {
        id: 'part-2',
        userId: 'u-2',
        amountCents: BigInt(3000),
        status: ParticipantStatus.PENDING,
        transactionId: null,
        paidAt: null,
      },
    ],
    ...overrides,
  };
}

describe('SplitsService', () => {
  let service: SplitsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SplitsService(mockPrisma as any, mockKafka as any);
  });


  describe('create', () => {
    const validData = {
      creatorId: 'u-1',
      title: 'Dinner',
      totalCents: 6000,
      participants: [
        { userId: 'u-1', amountCents: 3000 },
        { userId: 'u-2', amountCents: 3000 },
      ],
    };

    it('throws when totalCents is not positive', async () => {
      await expect(
        service.create({ ...validData, totalCents: 0 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when participants list is empty', async () => {
      await expect(
        service.create({ ...validData, participants: [] }),
      ).rejects.toThrow('At least one participant required');
    });

    it('throws when participant amounts do not sum to total', async () => {
      await expect(
        service.create({
          ...validData,
          participants: [
            { userId: 'u-1', amountCents: 2000 },
            { userId: 'u-2', amountCents: 2000 },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws on duplicate participants', async () => {
      await expect(
        service.create({
          ...validData,
          participants: [
            { userId: 'u-1', amountCents: 3000 },
            { userId: 'u-1', amountCents: 3000 },
          ],
        }),
      ).rejects.toThrow('Duplicate participants detected');
    });

    it('creates split and emits social.split_created', async () => {
      const split = makeSplit();
      mockPrisma.billSplit.create.mockResolvedValue(split);

      const result = await service.create(validData);

      expect(mockPrisma.billSplit.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            creatorId: 'u-1',
            title: 'Dinner',
            status: SplitStatus.OPEN,
          }),
        }),
      );
      expect(mockKafka.emit).toHaveBeenCalledWith(
        'social.events',
        expect.objectContaining({
          payload: expect.objectContaining({
            event: 'social.split_created',
            splitId: 'split-1',
          }),
        }),
      );
      expect(result.totalCents).toBe(6000); // BigInt converted to number
    });

    it('defaults currency to USD', async () => {
      const split = makeSplit();
      mockPrisma.billSplit.create.mockResolvedValue(split);

      await service.create(validData);

      expect(mockPrisma.billSplit.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ currency: 'USD' }),
        }),
      );
    });
  });


  describe('get', () => {
    it('throws NotFoundException when split does not exist', async () => {
      mockPrisma.billSplit.findUnique.mockResolvedValue(null);

      await expect(service.get('split-1', 'u-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when user is not a participant', async () => {
      mockPrisma.billSplit.findUnique.mockResolvedValue(makeSplit());

      await expect(service.get('split-1', 'u-99')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('returns split with participants for creator', async () => {
      mockPrisma.billSplit.findUnique.mockResolvedValue(makeSplit());

      const result = await service.get('split-1', 'u-1');

      expect(result.id).toBe('split-1');
      expect(result.totalCents).toBe(6000);
      expect(result.participants).toHaveLength(2);
    });

    it('returns split for a non-creator participant', async () => {
      mockPrisma.billSplit.findUnique.mockResolvedValue(makeSplit());

      const result = await service.get('split-1', 'u-2');

      expect(result.id).toBe('split-1');
    });
  });


  describe('list', () => {
    it('returns splits with paidCount and participantCount', async () => {
      const split = makeSplit({
        participants: [
          {
            userId: 'u-1',
            amountCents: BigInt(3000),
            status: ParticipantStatus.PAID,
          },
          {
            userId: 'u-2',
            amountCents: BigInt(3000),
            status: ParticipantStatus.PENDING,
          },
        ],
      });
      mockPrisma.billSplit.findMany.mockResolvedValue([split]);

      const result = await service.list('u-1');

      expect(result).toHaveLength(1);
      expect(result[0].participantCount).toBe(2);
      expect(result[0].paidCount).toBe(1);
    });
  });


  describe('pay', () => {
    it('throws NotFoundException when split does not exist', async () => {
      mockPrisma.billSplit.findUnique.mockResolvedValue(null);

      await expect(service.pay('split-1', 'u-1', 'tx-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when user is not a participant', async () => {
      mockPrisma.billSplit.findUnique.mockResolvedValue(makeSplit());

      await expect(service.pay('split-1', 'u-99', 'tx-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('is idempotent when participant already paid', async () => {
      const split = makeSplit({
        participants: [
          {
            id: 'part-1',
            userId: 'u-1',
            amountCents: BigInt(3000),
            status: ParticipantStatus.PAID,
            paidAt: new Date(),
          },
        ],
      });
      mockPrisma.billSplit.findUnique.mockResolvedValue(split);

      const result = await service.pay('split-1', 'u-1', 'tx-1');

      expect(mockPrisma.splitParticipant.update).not.toHaveBeenCalled();
      expect(result.status).toBe(ParticipantStatus.PAID);
    });

    it('marks participant as PAID and does not settle when others remain unpaid', async () => {
      const split = makeSplit();
      mockPrisma.billSplit.findUnique.mockResolvedValue(split);
      mockPrisma.splitParticipant.update.mockResolvedValue({
        id: 'part-1',
        status: ParticipantStatus.PAID,
        paidAt: new Date(),
      });
      mockPrisma.splitParticipant.findMany.mockResolvedValue([
        { status: ParticipantStatus.PAID },
        { status: ParticipantStatus.PENDING },
      ]);

      await service.pay('split-1', 'u-1', 'tx-1');

      expect(mockPrisma.billSplit.update).not.toHaveBeenCalled();
      expect(mockKafka.emit).not.toHaveBeenCalled();
    });

    it('settles the split and emits split_settled when all paid', async () => {
      const split = makeSplit();
      mockPrisma.billSplit.findUnique.mockResolvedValue(split);
      mockPrisma.splitParticipant.update.mockResolvedValue({
        id: 'part-2',
        status: ParticipantStatus.PAID,
        paidAt: new Date(),
      });
      mockPrisma.splitParticipant.findMany.mockResolvedValue([
        { status: ParticipantStatus.PAID },
        { status: ParticipantStatus.PAID },
      ]);
      mockPrisma.billSplit.update.mockResolvedValue({});

      await service.pay('split-1', 'u-2', 'tx-2');

      expect(mockPrisma.billSplit.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: SplitStatus.SETTLED }),
        }),
      );
      expect(mockKafka.emit).toHaveBeenCalledWith(
        'social.events',
        expect.objectContaining({
          payload: expect.objectContaining({ event: 'social.split_settled' }),
        }),
      );
    });
  });
});
