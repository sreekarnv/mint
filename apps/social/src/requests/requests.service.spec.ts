jest.mock('../generated/prisma/client', () => ({ PrismaClient: class {} }), {
  virtual: true,
});
jest.mock(
  '../generated/prisma/enums',
  () => ({
    RequestStatus: {
      PENDING: 'PENDING',
      ACCEPTED: 'ACCEPTED',
      DECLINED: 'DECLINED',
      CANCELLED: 'CANCELLED',
      EXPIRED: 'EXPIRED',
    },
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
import { RequestStatus } from '../generated/prisma/enums';
import { RequestsService } from './requests.service';

const mockPrisma = {
  moneyRequest: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  },
};

const mockQueue = {
  add: jest.fn(),
  getJob: jest.fn(),
};

const mockKafka = { emit: jest.fn() };

function makeRequest(overrides: Record<string, any> = {}) {
  return {
    id: 'req-1',
    requesterId: 'u-1',
    recipientId: 'u-2',
    amount: BigInt(1500),
    currency: 'USD',
    note: null,
    status: RequestStatus.PENDING,
    bullmqJobId: 'job-1',
    expiresAt: new Date(Date.now() + 48 * 3600 * 1000),
    createdAt: new Date(),
    acceptedAt: null,
    declinedAt: null,
    ...overrides,
  };
}

describe('RequestsService', () => {
  let service: RequestsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RequestsService(
      mockPrisma as any,
      mockQueue as any,
      mockKafka as any,
    );
    mockQueue.add.mockResolvedValue({ id: 'job-1' });
    mockQueue.getJob.mockResolvedValue({ remove: jest.fn() });
  });

  // ─── create ──────────────────────────────────────────────────────────────────

  describe('create', () => {
    const validData = { requesterId: 'u-1', recipientId: 'u-2', amount: 1500 };

    it('throws when requester and recipient are the same', async () => {
      await expect(
        service.create({
          requesterId: 'u-1',
          recipientId: 'u-1',
          amount: 1000,
        }),
      ).rejects.toThrow('Cannot request money from yourself');
    });

    it('throws when amount is not positive', async () => {
      await expect(service.create({ ...validData, amount: 0 })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('creates request, schedules BullMQ job, and emits money_request_sent', async () => {
      const request = makeRequest({ bullmqJobId: null });
      mockPrisma.moneyRequest.create.mockResolvedValue(request);
      mockPrisma.moneyRequest.update.mockResolvedValue(request);

      const result = await service.create(validData);

      expect(mockPrisma.moneyRequest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            requesterId: 'u-1',
            recipientId: 'u-2',
            status: RequestStatus.PENDING,
          }),
        }),
      );
      expect(mockQueue.add).toHaveBeenCalledWith(
        'expire-request',
        { requestId: 'req-1' },
        expect.objectContaining({ delay: 48 * 60 * 60 * 1000 }),
      );
      expect(mockKafka.emit).toHaveBeenCalledWith(
        'social.events',
        expect.objectContaining({
          payload: expect.objectContaining({
            event: 'social.money_request_sent',
            requesterId: 'u-1',
            recipientId: 'u-2',
          }),
        }),
      );
      expect(result.amount).toBe(1500); // BigInt converted
    });

    it('defaults currency to USD', async () => {
      const request = makeRequest();
      mockPrisma.moneyRequest.create.mockResolvedValue(request);
      mockPrisma.moneyRequest.update.mockResolvedValue(request);

      await service.create(validData);

      expect(mockPrisma.moneyRequest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ currency: 'USD' }),
        }),
      );
    });
  });

  // ─── accept ──────────────────────────────────────────────────────────────────

  describe('accept', () => {
    it('throws NotFoundException when request does not exist', async () => {
      mockPrisma.moneyRequest.findUnique.mockResolvedValue(null);

      await expect(service.accept('req-1', 'u-2')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when wrong user tries to accept', async () => {
      mockPrisma.moneyRequest.findUnique.mockResolvedValue(makeRequest());

      await expect(service.accept('req-1', 'u-99')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws BadRequestException when request is not PENDING', async () => {
      mockPrisma.moneyRequest.findUnique.mockResolvedValue(
        makeRequest({ status: RequestStatus.ACCEPTED }),
      );

      await expect(service.accept('req-1', 'u-2')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('updates status to ACCEPTED and emits money_request_accepted', async () => {
      const request = makeRequest();
      const updated = {
        ...request,
        status: RequestStatus.ACCEPTED,
        acceptedAt: new Date(),
      };
      mockPrisma.moneyRequest.findUnique.mockResolvedValue(request);
      mockPrisma.moneyRequest.update.mockResolvedValue(updated);

      const result = await service.accept('req-1', 'u-2');

      expect(mockPrisma.moneyRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: RequestStatus.ACCEPTED }),
        }),
      );
      expect(mockKafka.emit).toHaveBeenCalledWith(
        'social.events',
        expect.objectContaining({
          payload: expect.objectContaining({
            event: 'social.money_request_accepted',
          }),
        }),
      );
      expect(result.status).toBe(RequestStatus.ACCEPTED);
    });

    it('removes the BullMQ expiry job when accepting', async () => {
      const mockJob = { remove: jest.fn() };
      mockQueue.getJob.mockResolvedValue(mockJob);
      mockPrisma.moneyRequest.findUnique.mockResolvedValue(makeRequest());
      mockPrisma.moneyRequest.update.mockResolvedValue(
        makeRequest({ status: RequestStatus.ACCEPTED }),
      );

      await service.accept('req-1', 'u-2');

      expect(mockQueue.getJob).toHaveBeenCalledWith('job-1');
      expect(mockJob.remove).toHaveBeenCalled();
    });
  });

  // ─── decline ─────────────────────────────────────────────────────────────────

  describe('decline', () => {
    it('throws NotFoundException when request does not exist', async () => {
      mockPrisma.moneyRequest.findUnique.mockResolvedValue(null);

      await expect(service.decline('req-1', 'u-2')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when wrong user tries to decline', async () => {
      mockPrisma.moneyRequest.findUnique.mockResolvedValue(makeRequest());

      await expect(service.decline('req-1', 'u-99')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('updates status to DECLINED and emits money_request_declined', async () => {
      const updated = {
        ...makeRequest(),
        status: RequestStatus.DECLINED,
        declinedAt: new Date(),
      };
      mockPrisma.moneyRequest.findUnique.mockResolvedValue(makeRequest());
      mockPrisma.moneyRequest.update.mockResolvedValue(updated);

      const result = await service.decline('req-1', 'u-2');

      expect(mockPrisma.moneyRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: RequestStatus.DECLINED }),
        }),
      );
      expect(mockKafka.emit).toHaveBeenCalledWith(
        'social.events',
        expect.objectContaining({
          payload: expect.objectContaining({
            event: 'social.money_request_declined',
          }),
        }),
      );
      expect(result.status).toBe(RequestStatus.DECLINED);
    });
  });

  // ─── cancel ──────────────────────────────────────────────────────────────────

  describe('cancel', () => {
    it('throws NotFoundException when request does not exist', async () => {
      mockPrisma.moneyRequest.findUnique.mockResolvedValue(null);

      await expect(service.cancel('req-1', 'u-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when non-requester tries to cancel', async () => {
      mockPrisma.moneyRequest.findUnique.mockResolvedValue(makeRequest());

      await expect(service.cancel('req-1', 'u-99')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws BadRequestException when request is not PENDING', async () => {
      mockPrisma.moneyRequest.findUnique.mockResolvedValue(
        makeRequest({ status: RequestStatus.ACCEPTED }),
      );

      await expect(service.cancel('req-1', 'u-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('updates status to CANCELLED without emitting Kafka event', async () => {
      const updated = { ...makeRequest(), status: RequestStatus.CANCELLED };
      mockPrisma.moneyRequest.findUnique.mockResolvedValue(makeRequest());
      mockPrisma.moneyRequest.update.mockResolvedValue(updated);

      const result = await service.cancel('req-1', 'u-1');

      expect(mockPrisma.moneyRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: RequestStatus.CANCELLED },
        }),
      );
      expect(mockKafka.emit).not.toHaveBeenCalled();
      expect(result.status).toBe(RequestStatus.CANCELLED);
    });
  });

  // ─── expire ──────────────────────────────────────────────────────────────────

  describe('expire', () => {
    it('is a no-op when request does not exist', async () => {
      mockPrisma.moneyRequest.findUnique.mockResolvedValue(null);

      await expect(service.expire('req-1')).resolves.not.toThrow();
      expect(mockPrisma.moneyRequest.update).not.toHaveBeenCalled();
    });

    it('is a no-op when request is not PENDING', async () => {
      mockPrisma.moneyRequest.findUnique.mockResolvedValue(
        makeRequest({ status: RequestStatus.ACCEPTED }),
      );

      await service.expire('req-1');

      expect(mockPrisma.moneyRequest.update).not.toHaveBeenCalled();
      expect(mockKafka.emit).not.toHaveBeenCalled();
    });

    it('sets status to EXPIRED and emits money_request_expired', async () => {
      mockPrisma.moneyRequest.findUnique.mockResolvedValue(makeRequest());
      mockPrisma.moneyRequest.update.mockResolvedValue({});

      await service.expire('req-1');

      expect(mockPrisma.moneyRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: RequestStatus.EXPIRED }),
        }),
      );
      expect(mockKafka.emit).toHaveBeenCalledWith(
        'social.events',
        expect.objectContaining({
          payload: expect.objectContaining({
            event: 'social.money_request_expired',
            requestId: 'req-1',
          }),
        }),
      );
    });
  });

  // ─── list ─────────────────────────────────────────────────────────────────────

  describe('list', () => {
    it('returns requests for a user with amounts converted from BigInt', async () => {
      mockPrisma.moneyRequest.findMany.mockResolvedValue([
        { ...makeRequest(), amount: BigInt(1500) },
      ]);

      const result = await service.list('u-1');

      expect(result).toHaveLength(1);
      expect(result[0].amount).toBe(1500);
    });

    it('applies status filter when provided', async () => {
      mockPrisma.moneyRequest.findMany.mockResolvedValue([]);

      await service.list('u-1', { status: RequestStatus.PENDING });

      expect(mockPrisma.moneyRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: RequestStatus.PENDING }),
        }),
      );
    });
  });
});
