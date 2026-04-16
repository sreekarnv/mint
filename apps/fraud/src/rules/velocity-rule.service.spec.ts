import { ScoreRequest } from './base-rule.service';
import { VelocityRuleService } from './velocity-rule.service';

const mockRedis = {
  incr: jest.fn(),
  expire: jest.fn(),
};

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
    recipientIsContact: true,
    senderCurrency: 'USD',
    recipientCurrency: 'USD',
    usdEquivalentCents: 5000,
    ...overrides,
  };
}

describe('VelocityRuleService', () => {
  let service: VelocityRuleService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new VelocityRuleService(mockRedis as any);
  });

  it('does not fire on first transaction (count = 1) and sets TTL', async () => {
    mockRedis.incr.mockResolvedValue(1);

    const result = await service.evaluate(makeReq());

    expect(result.fired).toBe(false);
    expect(mockRedis.expire).toHaveBeenCalledWith('fraud:velocity:u-1', 3600);
  });

  it('does not set TTL on subsequent increments', async () => {
    mockRedis.incr.mockResolvedValue(3);

    await service.evaluate(makeReq());

    expect(mockRedis.expire).not.toHaveBeenCalled();
  });

  it('does not fire when count is exactly 5', async () => {
    mockRedis.incr.mockResolvedValue(5);

    const result = await service.evaluate(makeReq());

    expect(result.fired).toBe(false);
  });

  it('fires with forceBlock=true when count exceeds 5', async () => {
    mockRedis.incr.mockResolvedValue(6);

    const result = await service.evaluate(makeReq());

    expect(result.fired).toBe(true);
    expect(result.forceBlock).toBe(true);
    expect(result.score).toBe(100);
    expect(result.name).toBe('velocity_breach');
  });
});
