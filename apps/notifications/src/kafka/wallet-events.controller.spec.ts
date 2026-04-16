jest.mock('../generated/prisma/client', () => ({ PrismaClient: class {} }), {
  virtual: true,
});
jest.mock('@prisma/adapter-pg', () => ({ PrismaPg: class {} }), {
  virtual: true,
});

import { WalletEventsController } from './wallet-events.controller';

const mockNotifications = {
  create: jest.fn(),
};

describe('WalletEventsController', () => {
  let controller: WalletEventsController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new WalletEventsController(mockNotifications as any);
  });

  it('does not create notifications for any wallet event (placeholder handler)', async () => {
    await controller.handleWalletEvents({
      payload: { event: 'wallet.created', userId: 'u-1' },
    });
    expect(mockNotifications.create).not.toHaveBeenCalled();
  });

  it('handles missing payload gracefully', async () => {
    await expect(controller.handleWalletEvents({})).resolves.not.toThrow();
  });
});
