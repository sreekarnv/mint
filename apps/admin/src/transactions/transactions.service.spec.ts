import { TransactionsService } from './transactions.service';

const mockKafka = {
  connect: jest.fn(),
  emit: jest.fn(),
};

const ADMIN_ID = 'admin-1';
const TX_ID = 'tx-1';
const AUTH_HEADER = 'Bearer admin-token';

describe('TransactionsService', () => {
  let service: TransactionsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    service = new TransactionsService(mockKafka as any);
    await service.onModuleInit();
    process.env.TRANSACTIONS_SERVICE_URL = 'http://transactions:4003';
  });

  describe('listTransactions', () => {
    it('fetches from transactions service with all params', async () => {
      const txns = [{ id: TX_ID }];
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(txns),
      } as any);

      const result = await service.listTransactions(ADMIN_ID, AUTH_HEADER, {
        limit: 10,
        cursor: 'abc',
        userId: 'user-1',
        status: 'COMPLETED',
      });

      expect(fetch).toHaveBeenCalledWith(
        'http://transactions:4003/api/v1/transactions/admin/list?limit=10&cursor=abc&userId=user-1&status=COMPLETED',
        expect.objectContaining({ headers: { Authorization: AUTH_HEADER } }),
      );
      expect(result).toEqual(txns);
    });

    it('omits optional params from query string when not provided', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      } as any);

      await service.listTransactions(ADMIN_ID, AUTH_HEADER, { limit: 50 });

      const url = (fetch as jest.Mock).mock.calls[0][0] as string;
      expect(url).not.toContain('cursor');
      expect(url).not.toContain('userId');
      expect(url).not.toContain('status');
    });

    it('throws when transactions service returns non-ok', async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValue({ ok: false, status: 503 } as any);
      await expect(
        service.listTransactions(ADMIN_ID, AUTH_HEADER, { limit: 50 }),
      ).rejects.toThrow('Transactions list failed: 503');
    });
  });

  describe('reverseTransaction', () => {
    it('emits admin and audit events and returns success', async () => {
      const result = await service.reverseTransaction(
        TX_ID,
        ADMIN_ID,
        'customer dispute',
      );

      expect(result).toEqual({ success: true, transactionId: TX_ID });

      expect(mockKafka.emit).toHaveBeenCalledWith(
        'admin.events',
        expect.objectContaining({
          payload: expect.objectContaining({
            event: 'admin.transaction_reversed',
            transactionId: TX_ID,
            reversedBy: ADMIN_ID,
            reason: 'customer dispute',
          }),
        }),
      );

      const auditCall = mockKafka.emit.mock.calls.find(
        (c) => c[0] === 'audit.events',
      );
      expect(auditCall).toBeDefined();
      expect(auditCall[1]).toMatchObject({
        payload: { event: 'admin.transaction_reversed', transactionId: TX_ID },
      });
    });
  });

  describe('forceCompleteTransaction', () => {
    it('emits admin and audit events and returns success', async () => {
      const result = await service.forceCompleteTransaction(TX_ID, ADMIN_ID);

      expect(result).toEqual({ success: true, transactionId: TX_ID });

      expect(mockKafka.emit).toHaveBeenCalledWith(
        'admin.events',
        expect.objectContaining({
          payload: expect.objectContaining({
            event: 'admin.transaction_force_completed',
            transactionId: TX_ID,
            completedBy: ADMIN_ID,
          }),
        }),
      );

      const auditCall = mockKafka.emit.mock.calls.find(
        (c) => c[0] === 'audit.events',
      );
      expect(auditCall).toBeDefined();
      expect(auditCall[1]).toMatchObject({
        payload: {
          event: 'admin.transaction_force_completed',
          transactionId: TX_ID,
        },
      });
    });
  });
});
