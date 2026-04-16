jest.mock('../generated/prisma/client', () => ({ PrismaClient: class {} }), {
  virtual: true,
});
jest.mock('@prisma/adapter-pg', () => ({ PrismaPg: class {} }), {
  virtual: true,
});

import { TransactionEventsController } from './transaction-events.controller';

const mockNotifications = {
  create: jest.fn(),
  getUserEmail: jest.fn(),
  enqueueEmail: jest.fn(),
};

function makeEnvelope(payload: Record<string, any>) {
  return { payload: { event: 'transaction.completed', ...payload } };
}

describe('TransactionEventsController', () => {
  let controller: TransactionEventsController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new TransactionEventsController(mockNotifications as any);
    mockNotifications.create.mockResolvedValue({});
    mockNotifications.getUserEmail.mockResolvedValue(null);
    mockNotifications.enqueueEmail.mockResolvedValue({});
  });

  it('ignores unknown events', async () => {
    await controller.handleTransactionEvents({
      payload: { event: 'transaction.created' },
    });
    expect(mockNotifications.create).not.toHaveBeenCalled();
  });

  describe('TOPUP completed', () => {
    it('creates a single "Funds Added" notification for sender', async () => {
      await controller.handleTransactionEvents(
        makeEnvelope({
          type: 'TOPUP',
          senderId: 'u-1',
          senderAmount: 5000,
          senderCurrency: 'USD',
          transactionId: 'tx-1',
        }),
      );

      expect(mockNotifications.create).toHaveBeenCalledTimes(1);
      expect(mockNotifications.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'u-1',
          type: 'transaction.topup_completed',
          title: 'Funds Added',
        }),
      );
      expect(mockNotifications.enqueueEmail).not.toHaveBeenCalled();
    });
  });

  describe('TRANSFER completed', () => {
    const transferPayload = {
      type: 'TRANSFER',
      senderId: 'u-1',
      recipientId: 'u-2',
      senderAmount: 2000,
      senderCurrency: 'USD',
      transactionId: 'tx-2',
    };

    it('creates "Transfer Sent" notification for sender', async () => {
      await controller.handleTransactionEvents(makeEnvelope(transferPayload));

      const senderCall = mockNotifications.create.mock.calls.find(
        (c) => c[0].userId === 'u-1',
      );
      expect(senderCall).toBeDefined();
      expect(senderCall[0]).toMatchObject({
        type: 'transaction.completed',
        title: 'Transfer Sent',
      });
    });

    it('creates "Transfer Received" notification for recipient', async () => {
      await controller.handleTransactionEvents(makeEnvelope(transferPayload));

      const recipientCall = mockNotifications.create.mock.calls.find(
        (c) => c[0].userId === 'u-2',
      );
      expect(recipientCall).toBeDefined();
      expect(recipientCall[0]).toMatchObject({
        type: 'transaction.completed',
        title: 'Transfer Received',
      });
    });

    it('enqueues transfer-sent email when sender email is known', async () => {
      mockNotifications.getUserEmail.mockImplementation((id: string) =>
        id === 'u-1'
          ? Promise.resolve('sender@example.com')
          : Promise.resolve(null),
      );

      await controller.handleTransactionEvents(makeEnvelope(transferPayload));

      expect(mockNotifications.enqueueEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'sender@example.com',
          template: 'transfer-sent',
        }),
      );
    });

    it('enqueues transfer-received email when recipient email is known', async () => {
      mockNotifications.getUserEmail.mockImplementation((id: string) =>
        id === 'u-2'
          ? Promise.resolve('recipient@example.com')
          : Promise.resolve(null),
      );

      await controller.handleTransactionEvents(makeEnvelope(transferPayload));

      expect(mockNotifications.enqueueEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'recipient@example.com',
          template: 'transfer-received',
        }),
      );
    });

    it('skips recipient notification when recipientId is absent', async () => {
      const { recipientId: _, ...noRecipient } = transferPayload;
      await controller.handleTransactionEvents(makeEnvelope(noRecipient));

      expect(mockNotifications.create).toHaveBeenCalledTimes(1);
      expect(mockNotifications.create.mock.calls[0][0].userId).toBe('u-1');
    });
  });

  describe('fraud_blocked', () => {
    it('creates a "Transaction Blocked" notification for the user', async () => {
      await controller.handleTransactionEvents({
        payload: {
          event: 'transaction.fraud_blocked',
          userId: 'u-1',
          transactionId: 'tx-3',
          score: 95,
          rulesFired: ['HIGH_AMOUNT'],
        },
      });

      expect(mockNotifications.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'u-1',
          type: 'transaction.fraud_blocked',
          title: 'Transaction Blocked',
        }),
      );
    });
  });
});
