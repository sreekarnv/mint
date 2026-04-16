import { of } from 'rxjs';
import { FraudService } from './fraud.service';

const mockFraudClient = {
  listReviewQueue: jest.fn(),
};

const mockFraudGrpc = {
  getService: jest.fn(() => mockFraudClient),
};

const mockKafka = {
  connect: jest.fn(),
  emit: jest.fn(),
};

const ADMIN_ID = 'admin-1';
const CASE_ID = 'case-1';

describe('FraudService', () => {
  let service: FraudService;

  beforeEach(async () => {
    jest.clearAllMocks();
    service = new FraudService(mockFraudGrpc as any, mockKafka as any);
    await service.onModuleInit();
  });

  describe('listReviewQueue', () => {
    it('delegates to fraudClient with limit and offset', async () => {
      const items = [
        {
          caseId: CASE_ID,
          transactionId: 'tx-1',
          userId: 'u-1',
          score: 85,
          rulesFired: ['HIGH_AMOUNT'],
          createdAt: '',
        },
      ];
      mockFraudClient.listReviewQueue.mockReturnValue(of({ items, total: 1 }));

      const result = await service.listReviewQueue(ADMIN_ID, 20, 0);

      expect(mockFraudClient.listReviewQueue).toHaveBeenCalledWith({
        limit: 20,
        offset: 0,
      });
      expect(result).toEqual({ items, total: 1 });
    });
  });

  describe('approveFraudCase', () => {
    it('returns APPROVED outcome and emits admin + audit events', async () => {
      const result = await service.approveFraudCase(
        CASE_ID,
        ADMIN_ID,
        'looks fine',
      );

      expect(result).toEqual({
        success: true,
        caseId: CASE_ID,
        outcome: 'APPROVED',
      });

      expect(mockKafka.emit).toHaveBeenCalledWith(
        'admin.events',
        expect.objectContaining({
          payload: expect.objectContaining({
            event: 'admin.fraud_case_approved',
            caseId: CASE_ID,
            outcome: 'APPROVED',
            notes: 'looks fine',
          }),
        }),
      );

      const auditCall = mockKafka.emit.mock.calls.find(
        (c) => c[0] === 'audit.events',
      );
      expect(auditCall).toBeDefined();
      expect(auditCall[1]).toMatchObject({
        payload: { event: 'admin.fraud_case_reviewed', outcome: 'APPROVED' },
      });
    });

    it('works without optional notes', async () => {
      const result = await service.approveFraudCase(CASE_ID, ADMIN_ID);
      expect(result.outcome).toBe('APPROVED');
    });
  });

  describe('blockFraudCase', () => {
    it('returns BLOCKED outcome and emits admin + audit events', async () => {
      const result = await service.blockFraudCase(
        CASE_ID,
        ADMIN_ID,
        'stolen card',
      );

      expect(result).toEqual({
        success: true,
        caseId: CASE_ID,
        outcome: 'BLOCKED',
      });

      expect(mockKafka.emit).toHaveBeenCalledWith(
        'admin.events',
        expect.objectContaining({
          payload: expect.objectContaining({
            event: 'admin.fraud_case_blocked',
            caseId: CASE_ID,
            outcome: 'BLOCKED',
          }),
        }),
      );
    });
  });
});
