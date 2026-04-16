jest.mock('../generated/prisma/client', () => ({ PrismaClient: class {} }), {
  virtual: true,
});
jest.mock('@prisma/adapter-pg', () => ({ PrismaPg: class {} }), {
  virtual: true,
});

import { AuthEventsController } from './auth-events.controller';

const mockNotifications = {
  create: jest.fn(),
  upsertUserProfile: jest.fn(),
  getUserEmail: jest.fn(),
  enqueueEmail: jest.fn(),
};

describe('AuthEventsController', () => {
  let controller: AuthEventsController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AuthEventsController(mockNotifications as any);
    mockNotifications.create.mockResolvedValue({});
    mockNotifications.upsertUserProfile.mockResolvedValue({});
  });

  it('ignores unknown events', async () => {
    await controller.handleAuthEvents({
      payload: { event: 'auth.password_reset' },
    });
    expect(mockNotifications.create).not.toHaveBeenCalled();
    expect(mockNotifications.upsertUserProfile).not.toHaveBeenCalled();
  });

  describe('auth.user_registered', () => {
    const payload = {
      event: 'auth.user_registered',
      userId: 'u-1',
      email: 'alice@example.com',
      name: 'Alice',
    };

    it('upserts user profile with email and name', async () => {
      await controller.handleAuthEvents({ payload });

      expect(mockNotifications.upsertUserProfile).toHaveBeenCalledWith({
        userId: 'u-1',
        email: 'alice@example.com',
        name: 'Alice',
      });
    });

    it('creates a Welcome notification', async () => {
      await controller.handleAuthEvents({ payload });

      expect(mockNotifications.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'u-1',
          type: 'auth.user_registered',
          title: 'Welcome to Mint!',
        }),
      );
    });

    it('does not enqueue any email (FastAuth handles verification email)', async () => {
      await controller.handleAuthEvents({ payload });
      expect(mockNotifications.enqueueEmail).not.toHaveBeenCalled();
    });
  });

  describe('auth.user_verified', () => {
    const payload = {
      event: 'auth.user_verified',
      userId: 'u-2',
    };

    it('creates an Email Verified notification', async () => {
      await controller.handleAuthEvents({ payload });

      expect(mockNotifications.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'u-2',
          type: 'auth.user_verified',
          title: 'Email Verified',
        }),
      );
    });

    it('does not upsert profile or enqueue email', async () => {
      await controller.handleAuthEvents({ payload });
      expect(mockNotifications.upsertUserProfile).not.toHaveBeenCalled();
      expect(mockNotifications.enqueueEmail).not.toHaveBeenCalled();
    });
  });
});
