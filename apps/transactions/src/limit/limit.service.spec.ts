import { BadRequestException } from '@nestjs/common';
import { of } from 'rxjs';
import { LimitService } from './limit.service';

const mockRedis = {
  incrby: jest.fn(),
  decrby: jest.fn(),
  expire: jest.fn(),
};

const mockKycClient = {
  GetLimits: jest.fn(),
};

const mockKycGrpc = {
  getService: jest.fn(() => mockKycClient),
};

const LIMITS = {
  perTxnCents: 50_000,
  dailyCents: 200_000,
  monthlyCents: 1_000_000,
  limitsCurrency: 'USD',
};

describe('LimitService', () => {
  let service: LimitService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new LimitService(mockRedis as any, mockKycGrpc as any);
    mockKycClient.GetLimits.mockReturnValue(of(LIMITS));
  });

  // ─── checkAll ────────────────────────────────────────────────────────────────

  describe('checkAll', () => {
    it('throws when amount exceeds per-transaction limit', async () => {
      await expect(service.checkAll('u-1', 50_001)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('passes and increments Redis counters when within all limits', async () => {
      mockRedis.incrby.mockResolvedValue(5000); // well under limits

      await service.checkAll('u-1', 5000);

      expect(mockRedis.incrby).toHaveBeenCalledTimes(2); // daily + monthly
    });

    it('throws and rolls back when daily limit is exceeded', async () => {
      // First incrby (daily) returns value over limit; second (monthly) would pass
      mockRedis.incrby
        .mockResolvedValueOnce(200_001) // daily over limit
        .mockResolvedValue(100);

      await expect(service.checkAll('u-1', 1000)).rejects.toThrow(
        'Daily limit exceeded',
      );
      expect(mockRedis.decrby).toHaveBeenCalledTimes(1); // rollback daily
    });

    it('sets TTL on first increment (daily)', async () => {
      // incrby returns the amount itself → first time → set TTL
      mockRedis.incrby.mockResolvedValue(5000);

      await service.checkAll('u-1', 5000);

      // TTL should be set for daily key (86400s)
      expect(mockRedis.expire).toHaveBeenCalledWith(
        expect.stringMatching(/^limit:daily:/),
        86400,
      );
    });

    it('throws and rolls back when monthly limit is exceeded', async () => {
      mockRedis.incrby
        .mockResolvedValueOnce(5000) // daily fine
        .mockResolvedValueOnce(1_000_001); // monthly over limit

      await expect(service.checkAll('u-1', 1000)).rejects.toThrow(
        'Monthly limit exceeded',
      );
      expect(mockRedis.decrby).toHaveBeenCalledTimes(1);
    });
  });

  // ─── recordTransaction ───────────────────────────────────────────────────────

  describe('recordTransaction', () => {
    it('increments both daily and monthly counters', async () => {
      mockRedis.incrby.mockResolvedValue(1000);

      await service.recordTransaction('u-1', 1000);

      expect(mockRedis.incrby).toHaveBeenCalledTimes(2);
      expect(mockRedis.incrby).toHaveBeenCalledWith(
        expect.stringMatching(/^limit:daily:/),
        1000,
      );
      expect(mockRedis.incrby).toHaveBeenCalledWith(
        expect.stringMatching(/^limit:monthly:/),
        1000,
      );
    });
  });
});
