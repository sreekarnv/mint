jest.mock('../generated/prisma/client', () => ({ PrismaClient: class {} }), {
  virtual: true,
});
jest.mock('@prisma/adapter-pg', () => ({ PrismaPg: class {} }), {
  virtual: true,
});

import { KycEventsController } from './kyc-events.controller';

const mockNotifications = {
  create: jest.fn(),
  getUserEmail: jest.fn(),
  enqueueEmail: jest.fn(),
};

describe('KycEventsController', () => {
  let controller: KycEventsController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new KycEventsController(mockNotifications as any);
    mockNotifications.create.mockResolvedValue({});
    mockNotifications.getUserEmail.mockResolvedValue(null);
    mockNotifications.enqueueEmail.mockResolvedValue({});
  });

  it('ignores unknown events', async () => {
    await controller.handleKycEvents({ payload: { event: 'kyc.submitted' } });
    expect(mockNotifications.create).not.toHaveBeenCalled();
  });

  describe('kyc.tier_upgraded', () => {
    it('creates "Verification Level Upgraded" notification for non-VERIFIED tier', async () => {
      await controller.handleKycEvents({
        payload: {
          event: 'kyc.tier_upgraded',
          userId: 'u-1',
          previousTier: 'NONE',
          newTier: 'BASIC',
        },
      });

      expect(mockNotifications.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'u-1',
          type: 'kyc.tier_upgraded',
          title: 'Verification Level Upgraded',
        }),
      );
    });

    it('creates "Identity Fully Verified" notification when newTier is VERIFIED', async () => {
      await controller.handleKycEvents({
        payload: {
          event: 'kyc.tier_upgraded',
          userId: 'u-1',
          previousTier: 'BASIC',
          newTier: 'VERIFIED',
        },
      });

      expect(mockNotifications.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'u-1',
          type: 'kyc.tier_upgraded',
          title: 'Identity Fully Verified',
        }),
      );
    });

    it('enqueues kyc-approved email when tier is VERIFIED and email known', async () => {
      mockNotifications.getUserEmail.mockResolvedValue('user@example.com');

      await controller.handleKycEvents({
        payload: {
          event: 'kyc.tier_upgraded',
          userId: 'u-1',
          previousTier: 'BASIC',
          newTier: 'VERIFIED',
        },
      });

      expect(mockNotifications.enqueueEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          template: 'kyc-approved',
        }),
      );
    });

    it('skips email for VERIFIED tier when email is not known', async () => {
      mockNotifications.getUserEmail.mockResolvedValue(null);

      await controller.handleKycEvents({
        payload: {
          event: 'kyc.tier_upgraded',
          userId: 'u-1',
          previousTier: 'BASIC',
          newTier: 'VERIFIED',
        },
      });

      expect(mockNotifications.enqueueEmail).not.toHaveBeenCalled();
    });

    it('does not enqueue email for non-VERIFIED tier upgrades', async () => {
      mockNotifications.getUserEmail.mockResolvedValue('user@example.com');

      await controller.handleKycEvents({
        payload: {
          event: 'kyc.tier_upgraded',
          userId: 'u-1',
          previousTier: 'NONE',
          newTier: 'BASIC',
        },
      });

      expect(mockNotifications.enqueueEmail).not.toHaveBeenCalled();
    });
  });

  describe('kyc.verification_failed', () => {
    it('creates a "Verification Failed" notification', async () => {
      await controller.handleKycEvents({
        payload: {
          event: 'kyc.verification_failed',
          userId: 'u-1',
          reason: 'Document expired',
        },
      });

      expect(mockNotifications.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'u-1',
          type: 'kyc.verification_failed',
          title: 'Verification Failed',
        }),
      );
    });

    it('enqueues kyc-rejected email when email is known', async () => {
      mockNotifications.getUserEmail.mockResolvedValue('user@example.com');

      await controller.handleKycEvents({
        payload: {
          event: 'kyc.verification_failed',
          userId: 'u-1',
          reason: 'Document expired',
        },
      });

      expect(mockNotifications.enqueueEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          template: 'kyc-rejected',
          variables: expect.objectContaining({ reason: 'Document expired' }),
        }),
      );
    });

    it('uses fallback reason text when reason is absent', async () => {
      mockNotifications.getUserEmail.mockResolvedValue('user@example.com');

      await controller.handleKycEvents({
        payload: {
          event: 'kyc.verification_failed',
          userId: 'u-1',
        },
      });

      expect(mockNotifications.enqueueEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({
            reason: 'Documents could not be verified',
          }),
        }),
      );
    });

    it('skips email when email is not known', async () => {
      await controller.handleKycEvents({
        payload: {
          event: 'kyc.verification_failed',
          userId: 'u-1',
          reason: 'Blurry image',
        },
      });

      expect(mockNotifications.enqueueEmail).not.toHaveBeenCalled();
    });
  });
});
