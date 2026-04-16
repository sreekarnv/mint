jest.mock('../generated/prisma/client', () => ({ PrismaClient: class {} }), {
  virtual: true,
});
jest.mock('@prisma/adapter-pg', () => ({ PrismaPg: class {} }), {
  virtual: true,
});

import { SocialEventsController } from './social-events.controller';

const mockNotifications = {
  create: jest.fn(),
};

describe('SocialEventsController', () => {
  let controller: SocialEventsController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new SocialEventsController(mockNotifications as any);
    mockNotifications.create.mockResolvedValue({});
  });

  it('ignores unknown events', async () => {
    await controller.handleSocialEvents({
      payload: { event: 'social.unknown' },
    });
    expect(mockNotifications.create).not.toHaveBeenCalled();
  });

  describe('social.split_created', () => {
    const payload = {
      event: 'social.split_created',
      splitId: 's-1',
      creatorId: 'u-1',
      participants: ['u-1', 'u-2', 'u-3'],
      title: 'Dinner',
      totalCents: 6000,
      currency: 'USD',
    };

    it('notifies each participant except the creator', async () => {
      await controller.handleSocialEvents({ payload });

      expect(mockNotifications.create).toHaveBeenCalledTimes(2);
      const calledUserIds = mockNotifications.create.mock.calls.map(
        (c) => c[0].userId,
      );
      expect(calledUserIds).toContain('u-2');
      expect(calledUserIds).toContain('u-3');
      expect(calledUserIds).not.toContain('u-1');
    });

    it('creates notifications with correct type and title', async () => {
      await controller.handleSocialEvents({ payload });

      for (const call of mockNotifications.create.mock.calls) {
        expect(call[0]).toMatchObject({
          type: 'social.split_created',
          title: 'Added to Bill Split',
        });
      }
    });
  });

  describe('social.split_settled', () => {
    it('notifies all participants', async () => {
      await controller.handleSocialEvents({
        payload: {
          event: 'social.split_settled',
          splitId: 's-2',
          participants: ['u-1', 'u-2'],
          title: 'Lunch',
          totalCents: 3000,
          currency: 'USD',
        },
      });

      expect(mockNotifications.create).toHaveBeenCalledTimes(2);
      const calledUserIds = mockNotifications.create.mock.calls.map(
        (c) => c[0].userId,
      );
      expect(calledUserIds).toContain('u-1');
      expect(calledUserIds).toContain('u-2');
    });

    it('creates notifications with correct type and title', async () => {
      await controller.handleSocialEvents({
        payload: {
          event: 'social.split_settled',
          splitId: 's-2',
          participants: ['u-1'],
          title: 'Coffee',
          totalCents: 500,
          currency: 'USD',
        },
      });

      expect(mockNotifications.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'social.split_settled',
          title: 'Bill Split Settled',
        }),
      );
    });
  });

  describe('social.money_request_sent', () => {
    it('notifies the recipient with correct type and title', async () => {
      await controller.handleSocialEvents({
        payload: {
          event: 'social.money_request_sent',
          requestId: 'r-1',
          requesterId: 'u-1',
          recipientId: 'u-2',
          amount: 1500,
          currency: 'USD',
        },
      });

      expect(mockNotifications.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'u-2',
          type: 'social.money_request_sent',
          title: 'Money Request',
        }),
      );
    });
  });

  describe('social.money_request_accepted', () => {
    it('notifies the requester', async () => {
      await controller.handleSocialEvents({
        payload: {
          event: 'social.money_request_accepted',
          requestId: 'r-1',
          requesterId: 'u-1',
          amount: 1000,
          currency: 'USD',
        },
      });

      expect(mockNotifications.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'u-1',
          type: 'social.money_request_accepted',
          title: 'Money Request Accepted',
        }),
      );
    });
  });

  describe('social.money_request_declined', () => {
    it('notifies the requester', async () => {
      await controller.handleSocialEvents({
        payload: {
          event: 'social.money_request_declined',
          requestId: 'r-1',
          requesterId: 'u-1',
          amount: 1000,
          currency: 'USD',
        },
      });

      expect(mockNotifications.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'u-1',
          type: 'social.money_request_declined',
          title: 'Money Request Declined',
        }),
      );
    });
  });

  describe('social.money_request_expired', () => {
    it('notifies the requester', async () => {
      await controller.handleSocialEvents({
        payload: {
          event: 'social.money_request_expired',
          requestId: 'r-1',
          requesterId: 'u-1',
        },
      });

      expect(mockNotifications.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'u-1',
          type: 'social.money_request_expired',
          title: 'Money Request Expired',
        }),
      );
    });
  });
});
