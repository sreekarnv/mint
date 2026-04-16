jest.mock('./generated/prisma/client', () => ({ PrismaClient: class {} }), {
  virtual: true,
});
jest.mock('@prisma/adapter-pg', () => ({ PrismaPg: class {} }), {
  virtual: true,
});
jest.mock('./generated/prisma/internal/prismaNamespace', () => ({}), {
  virtual: true,
});
jest.mock('./generated/prisma/models', () => ({}), { virtual: true });

import { AuditEventsConsumer } from './audit-events.consumer';

const mockAuditService = {
  appendEntry: jest.fn(),
};

const MESSAGE = { eventId: 'e-1', topic: 'auth.events', payload: {} };

describe('AuditEventsConsumer', () => {
  let consumer: AuditEventsConsumer;

  beforeEach(() => {
    jest.clearAllMocks();
    consumer = new AuditEventsConsumer(mockAuditService as any);
    mockAuditService.appendEntry.mockResolvedValue(undefined);
  });

  it.each([
    ['handleAuthEvents', 'auth.events'],
    ['handleWalletEvents', 'wallet.events'],
    ['handleTransactionEvents', 'transaction.events'],
    ['handleKycEvents', 'kyc.events'],
    ['handleSocialEvents', 'social.events'],
    ['handleAnalyticsEvents', 'analytics.events'],
    ['handleWebhookEvents', 'webhook.events'],
    ['handleAdminEvents', 'admin.events'],
    ['handleAuditEvents', 'audit.events'],
  ])('%s delegates to auditService.appendEntry', async (method) => {
    await (consumer as any)[method](MESSAGE);

    expect(mockAuditService.appendEntry).toHaveBeenCalledWith(MESSAGE);
  });
});
