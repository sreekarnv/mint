import { ScoreRequest } from './base-rule.service';
import { NightLargeRuleService } from './night-large-rule.service';

function makeReq(overrides: Partial<ScoreRequest> = {}): ScoreRequest {
  return {
    transactionId: 'tx-1',
    userId: 'u-1',
    recipientId: 'u-2',
    amountCents: 60000,
    currency: 'USD',
    ipAddress: '1.2.3.4',
    transactionType: 'TRANSFER',
    userCountry: 'US',
    recipientIsContact: false,
    senderCurrency: 'USD',
    recipientCurrency: 'USD',
    usdEquivalentCents: 60000,
    ...overrides,
  };
}

describe('NightLargeRuleService', () => {
  let service: NightLargeRuleService;
  let getUTCHours: jest.SpyInstance;

  beforeEach(() => {
    service = new NightLargeRuleService();
    getUTCHours = jest.spyOn(Date.prototype, 'getUTCHours');
  });

  afterEach(() => {
    getUTCHours.mockRestore();
  });

  it('does not fire when amount is at or below $500 threshold', async () => {
    getUTCHours.mockReturnValue(2);

    const result = await service.evaluate(
      makeReq({ usdEquivalentCents: 50000 }),
    );

    expect(result.fired).toBe(false);
  });

  it('does not fire during daytime hours (UTC 5-23) even for large amounts', async () => {
    getUTCHours.mockReturnValue(12);

    const result = await service.evaluate(
      makeReq({ usdEquivalentCents: 100000 }),
    );

    expect(result.fired).toBe(false);
  });

  it('fires for large amount during night hours (UTC 0-4)', async () => {
    getUTCHours.mockReturnValue(3);

    const result = await service.evaluate(
      makeReq({ usdEquivalentCents: 60000 }),
    );

    expect(result.fired).toBe(true);
    expect(result.score).toBe(30);
    expect(result.forceBlock).toBe(false);
    expect(result.name).toBe('night_large');
  });

  it('fires at UTC hour 0 (midnight)', async () => {
    getUTCHours.mockReturnValue(0);

    const result = await service.evaluate(
      makeReq({ usdEquivalentCents: 60000 }),
    );

    expect(result.fired).toBe(true);
  });

  it('does not fire at UTC hour 5 (boundary)', async () => {
    getUTCHours.mockReturnValue(5);

    const result = await service.evaluate(
      makeReq({ usdEquivalentCents: 60000 }),
    );

    expect(result.fired).toBe(false);
  });

  it('uses amountCents as fallback when usdEquivalentCents is 0', async () => {
    getUTCHours.mockReturnValue(2);

    const result = await service.evaluate(
      makeReq({ usdEquivalentCents: 0, amountCents: 60000 }),
    );

    expect(result.fired).toBe(true);
  });
});
