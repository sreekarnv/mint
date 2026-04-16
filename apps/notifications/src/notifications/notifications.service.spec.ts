jest.mock('../generated/prisma/client', () => ({ PrismaClient: class {} }), {
  virtual: true,
});
jest.mock('@prisma/adapter-pg', () => ({ PrismaPg: class {} }), {
  virtual: true,
});

import { NotificationsService } from './notifications.service';

const mockPrisma = {
  notification: { create: jest.fn() },
  userProfile: { upsert: jest.fn(), findUnique: jest.fn() },
};

const mockSse = { broadcast: jest.fn() };

const mockEmailQueue = { add: jest.fn() };

const USER_ID = 'user-1';

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new NotificationsService(
      mockPrisma as any,
      mockSse as any,
      mockEmailQueue as any,
    );
  });

  describe('create', () => {
    it('persists the notification and broadcasts via SSE', async () => {
      const created = {
        id: 'n-1',
        userId: USER_ID,
        type: 'test',
        title: 'T',
        body: 'B',
      };
      mockPrisma.notification.create.mockResolvedValue(created);

      const result = await service.create({
        userId: USER_ID,
        type: 'test',
        title: 'T',
        body: 'B',
      });

      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: USER_ID,
          type: 'test',
          title: 'T',
          body: 'B',
        }),
      });
      expect(mockSse.broadcast).toHaveBeenCalledWith(USER_ID, created);
      expect(result).toEqual(created);
    });

    it('stores optional data field when provided', async () => {
      mockPrisma.notification.create.mockResolvedValue({});
      const data = { transactionId: 'tx-1' };

      await service.create({
        userId: USER_ID,
        type: 't',
        title: 'T',
        body: 'B',
        data,
      });

      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ data }),
      });
    });
  });

  describe('upsertUserProfile', () => {
    it('upserts with create and update payloads', async () => {
      mockPrisma.userProfile.upsert.mockResolvedValue({});

      await service.upsertUserProfile({
        userId: USER_ID,
        email: 'a@b.com',
        name: 'Alice',
      });

      expect(mockPrisma.userProfile.upsert).toHaveBeenCalledWith({
        where: { userId: USER_ID },
        create: { userId: USER_ID, email: 'a@b.com', name: 'Alice' },
        update: { email: 'a@b.com', name: 'Alice' },
      });
    });
  });

  describe('getUserEmail', () => {
    it('returns the email when profile exists', async () => {
      mockPrisma.userProfile.findUnique.mockResolvedValue({ email: 'a@b.com' });

      const email = await service.getUserEmail(USER_ID);

      expect(email).toBe('a@b.com');
    });

    it('returns null when profile does not exist', async () => {
      mockPrisma.userProfile.findUnique.mockResolvedValue(null);

      const email = await service.getUserEmail(USER_ID);

      expect(email).toBeNull();
    });
  });

  describe('enqueueEmail', () => {
    it('adds job to email queue with retry config', async () => {
      mockEmailQueue.add.mockResolvedValue({});

      await service.enqueueEmail({
        to: 'a@b.com',
        subject: 'Hello',
        template: 'transfer-sent',
        variables: { amount: '10.00' },
      });

      expect(mockEmailQueue.add).toHaveBeenCalledWith(
        'send',
        {
          to: 'a@b.com',
          subject: 'Hello',
          template: 'transfer-sent',
          variables: { amount: '10.00' },
        },
        expect.objectContaining({ attempts: 3 }),
      );
    });
  });
});
