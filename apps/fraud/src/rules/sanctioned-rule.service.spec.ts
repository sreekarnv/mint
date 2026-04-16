import { ScoreRequest } from './base-rule.service';
import { SanctionedRuleService } from './sanctioned-rule.service';

const mockRedis = { sismember: jest.fn() };

function makeReq(overrides: Partial<ScoreRequest> = {}): ScoreRequest {
  return {
    transactionId: 'tx-1',
    userId: 'u-1',
    recipientId: 'u-2',
    amountCents: 5000,
    currency: 'USD',
    ipAddress: '1.2.3.4',
    transactionType: 'TRANSFER',
    userCountry: 'US',
    recipientIsContact: false,
    senderCurrency: 'USD',
    recipientCurrency: 'USD',
    usdEquivalentCents: 5000,
    ...overrides,
  };
}

describe('SanctionedRuleService', () => {
  let service: SanctionedRuleService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SanctionedRuleService(mockRedis as any);
  });

  it('does not fire when recipient is not on sanctions list', async () => {
    mockRedis.sismember.mockResolvedValue(0);

    const result = await service.evaluate(makeReq());

    expect(result.fired).toBe(false);
    expect(mockRedis.sismember).toHaveBeenCalledWith('fraud:sanctions', 'u-2');
  });

  it('fires with forceBlock=true when recipient is on sanctions list', async () => {
    mockRedis.sismember.mockResolvedValue(1);

    const result = await service.evaluate(makeReq());

    expect(result.fired).toBe(true);
    expect(result.forceBlock).toBe(true);
    expect(result.score).toBe(100);
    expect(result.name).toBe('sanctioned_recipient');
  });
});
