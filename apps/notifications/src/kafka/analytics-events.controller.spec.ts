jest.mock('../generated/prisma/client', () => ({ PrismaClient: class {} }), {
  virtual: true,
});
jest.mock('@prisma/adapter-pg', () => ({ PrismaPg: class {} }), {
  virtual: true,
});

import { AnalyticsEventsController } from './analytics-events.controller';

const mockNotifications = {
  create: jest.fn(),
  getUserEmail: jest.fn(),
  enqueueEmail: jest.fn(),
};

describe('AnalyticsEventsController', () => {
  let controller: AnalyticsEventsController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AnalyticsEventsController(mockNotifications as any);
    mockNotifications.create.mockResolvedValue({});
    mockNotifications.getUserEmail.mockResolvedValue(null);
    mockNotifications.enqueueEmail.mockResolvedValue({});
  });

  it('ignores unknown events', async () => {
    await controller.handleAnalyticsEvents({
      payload: { event: 'analytics.spend_recorded' },
    });
    expect(mockNotifications.create).not.toHaveBeenCalled();
  });

  describe('analytics.budget_warning', () => {
    const payload = {
      event: 'analytics.budget_warning',
      userId: 'u-1',
      category: 'FOOD',
      used: 8000,
      limit: 10000,
      ratio: 0.8,
    };

    it('creates a "Budget Warning" notification', async () => {
      await controller.handleAnalyticsEvents({ payload });

      expect(mockNotifications.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'u-1',
          type: 'analytics.budget_warning',
          title: 'Budget Warning',
        }),
      );
    });

    it('enqueues budget-warning email when email is known', async () => {
      mockNotifications.getUserEmail.mockResolvedValue('user@example.com');

      await controller.handleAnalyticsEvents({ payload });

      expect(mockNotifications.enqueueEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          template: 'budget-warning',
          variables: expect.objectContaining({ category: 'FOOD', ratio: '80' }),
        }),
      );
    });

    it('skips email when email is not known', async () => {
      await controller.handleAnalyticsEvents({ payload });
      expect(mockNotifications.enqueueEmail).not.toHaveBeenCalled();
    });

    it('defaults ratio to 0.8 when not provided', async () => {
      const { ratio: _, ...noRatio } = payload;
      mockNotifications.getUserEmail.mockResolvedValue('user@example.com');

      await controller.handleAnalyticsEvents({ payload: noRatio });

      expect(mockNotifications.enqueueEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({ ratio: '80' }),
        }),
      );
    });
  });

  describe('analytics.budget_exceeded', () => {
    const payload = {
      event: 'analytics.budget_exceeded',
      userId: 'u-1',
      category: 'TRANSPORT',
      used: 12000,
      limit: 10000,
    };

    it('creates a "Budget Exceeded" notification', async () => {
      await controller.handleAnalyticsEvents({ payload });

      expect(mockNotifications.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'u-1',
          type: 'analytics.budget_exceeded',
          title: 'Budget Exceeded',
        }),
      );
    });

    it('enqueues budget-exceeded email when email is known', async () => {
      mockNotifications.getUserEmail.mockResolvedValue('user@example.com');

      await controller.handleAnalyticsEvents({ payload });

      expect(mockNotifications.enqueueEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          template: 'budget-exceeded',
          variables: expect.objectContaining({ category: 'TRANSPORT' }),
        }),
      );
    });

    it('skips email when email is not known', async () => {
      await controller.handleAnalyticsEvents({ payload });
      expect(mockNotifications.enqueueEmail).not.toHaveBeenCalled();
    });
  });
});
