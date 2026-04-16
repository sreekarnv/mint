import { of } from 'rxjs';
import { KycService } from './kyc.service';

const mockKycClient = {
  getProfile: jest.fn(),
  listPendingQueue: jest.fn(),
};

const mockKycGrpc = {
  getService: jest.fn(() => mockKycClient),
};

const mockKafka = {
  connect: jest.fn(),
  emit: jest.fn(),
};

const ADMIN_ID = 'admin-1';
const USER_ID = 'user-1';
const PROFILE_ID = 'profile-1';

describe('KycService', () => {
  let service: KycService;

  beforeEach(async () => {
    jest.clearAllMocks();
    service = new KycService(mockKycGrpc as any, mockKafka as any);
    await service.onModuleInit();
  });

  describe('listPendingQueue', () => {
    it('delegates to kycClient with limit and offset', async () => {
      const items = [
        {
          profileId: PROFILE_ID,
          userId: USER_ID,
          tier: 'BASIC',
          submittedAt: '',
        },
      ];
      mockKycClient.listPendingQueue.mockReturnValue(of({ items, total: 1 }));

      const result = await service.listPendingQueue(ADMIN_ID, 10, 0);

      expect(mockKycClient.listPendingQueue).toHaveBeenCalledWith({
        limit: 10,
        offset: 0,
      });
      expect(result).toEqual({ items, total: 1 });
    });
  });

  describe('getKycProfile', () => {
    it('returns profile from gRPC and emits audit event', async () => {
      const profile = {
        profileId: PROFILE_ID,
        tier: 'BASIC',
        status: 'PENDING',
        isFrozen: false,
        submittedAt: '',
        rejectionReason: '',
        documents: [],
      };
      mockKycClient.getProfile.mockReturnValue(of(profile));

      const result = await service.getKycProfile(USER_ID, ADMIN_ID);

      expect(mockKycClient.getProfile).toHaveBeenCalledWith({
        userId: USER_ID,
      });
      expect(result).toEqual(profile);
      expect(mockKafka.emit).toHaveBeenCalledWith(
        'audit.events',
        expect.objectContaining({
          payload: expect.objectContaining({
            event: 'admin.kyc_viewed',
            userId: USER_ID,
          }),
        }),
      );
    });
  });

  describe('approveKyc', () => {
    it('emits admin.events with kyc_approved payload and returns success', async () => {
      const result = await service.approveKyc(PROFILE_ID, ADMIN_ID);

      expect(result).toEqual({ success: true, profileId: PROFILE_ID });
      expect(mockKafka.emit).toHaveBeenCalledWith(
        'admin.events',
        expect.objectContaining({
          payload: expect.objectContaining({
            event: 'admin.kyc_approved',
            profileId: PROFILE_ID,
            approvedBy: ADMIN_ID,
          }),
        }),
      );
    });

    it('also emits audit.events', async () => {
      await service.approveKyc(PROFILE_ID, ADMIN_ID);

      const auditCall = mockKafka.emit.mock.calls.find(
        (c) => c[0] === 'audit.events',
      );
      expect(auditCall).toBeDefined();
      expect(auditCall[1]).toMatchObject({
        payload: { event: 'admin.kyc_approved', profileId: PROFILE_ID },
      });
    });
  });

  describe('rejectKyc', () => {
    it('emits admin.events with kyc_rejected payload and returns success', async () => {
      const result = await service.rejectKyc(
        PROFILE_ID,
        ADMIN_ID,
        'blurry docs',
      );

      expect(result).toEqual({ success: true, profileId: PROFILE_ID });
      expect(mockKafka.emit).toHaveBeenCalledWith(
        'admin.events',
        expect.objectContaining({
          payload: expect.objectContaining({
            event: 'admin.kyc_rejected',
            profileId: PROFILE_ID,
            rejectedBy: ADMIN_ID,
            reason: 'blurry docs',
          }),
        }),
      );
    });
  });
});
