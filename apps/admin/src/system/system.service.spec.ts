import { SystemService } from './system.service';

const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
};

const mockKafka = {
  connect: jest.fn(),
  emit: jest.fn(),
};

const ADMIN_ID = 'admin-1';

const DEFAULT_LIMITS = {
  UNVERIFIED: { perTxnCents: 5000, dailyCents: 10000, monthlyCents: 20000 },
  BASIC: { perTxnCents: 50000, dailyCents: 200000, monthlyCents: 1000000 },
  VERIFIED: {
    perTxnCents: 1000000,
    dailyCents: 5000000,
    monthlyCents: 20000000,
  },
};

describe('SystemService', () => {
  let service: SystemService;

  beforeEach(async () => {
    jest.clearAllMocks();
    service = new SystemService(mockRedis as any, mockKafka as any);
    await service.onModuleInit();
  });

  describe('getLimits', () => {
    it('returns hardcoded defaults when Redis has no stored limits', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await service.getLimits();

      expect(result).toEqual(DEFAULT_LIMITS);
    });

    it('returns parsed JSON when Redis has stored limits', async () => {
      const custom = {
        UNVERIFIED: { perTxnCents: 1000, dailyCents: 2000, monthlyCents: 5000 },
        BASIC: { perTxnCents: 10000, dailyCents: 50000, monthlyCents: 200000 },
        VERIFIED: {
          perTxnCents: 500000,
          dailyCents: 2000000,
          monthlyCents: 10000000,
        },
      };
      mockRedis.get.mockResolvedValue(JSON.stringify(custom));

      const result = await service.getLimits();

      expect(result).toEqual(custom);
    });
  });

  describe('updateLimits', () => {
    it('writes serialized limits to Redis and returns success', async () => {
      mockRedis.set.mockResolvedValue('OK');

      const result = await service.updateLimits(ADMIN_ID, DEFAULT_LIMITS);

      expect(mockRedis.set).toHaveBeenCalledWith(
        'system:kyc_limits',
        JSON.stringify(DEFAULT_LIMITS),
      );
      expect(result).toEqual({ success: true, limits: DEFAULT_LIMITS });
    });

    it('emits audit event after updating limits', async () => {
      mockRedis.set.mockResolvedValue('OK');

      await service.updateLimits(ADMIN_ID, DEFAULT_LIMITS);

      expect(mockKafka.emit).toHaveBeenCalledWith(
        'audit.events',
        expect.objectContaining({
          actorId: ADMIN_ID,
          payload: expect.objectContaining({
            event: 'admin.limits_updated',
            updatedBy: ADMIN_ID,
            newLimits: DEFAULT_LIMITS,
          }),
        }),
      );
    });
  });
});
