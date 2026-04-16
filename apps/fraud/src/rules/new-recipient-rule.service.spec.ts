import { ScoreRequest } from './base-rule.service';
import { NewRecipientRuleService } from './new-recipient-rule.service';

function makeReq(overrides: Partial<ScoreRequest> = {}): ScoreRequest {
  return {
    transactionId: 'tx-1',
    userId: 'u-1',
    recipientId: 'u-2',
    amountCents: 10000,
    currency: 'USD',
    ipAddress: '1.2.3.4',
    transactionType: 'TRANSFER',
    userCountry: 'US',
    recipientIsContact: false,
    senderCurrency: 'USD',
    recipientCurrency: 'USD',
    usdEquivalentCents: 10000,
    ...overrides,
  };
}

describe('NewRecipientRuleService', () => {
  let service: NewRecipientRuleService;

  beforeEach(() => {
    service = new NewRecipientRuleService();
  });

  it('does not fire when recipient is a known contact', async () => {
    const result = await service.evaluate(
      makeReq({ recipientIsContact: true, usdEquivalentCents: 50000 }),
    );
    expect(result.fired).toBe(false);
  });

  it('does not fire when amount is at or below $200 threshold', async () => {
    const result = await service.evaluate(
      makeReq({ recipientIsContact: false, usdEquivalentCents: 20000 }),
    );
    expect(result.fired).toBe(false);
  });

  it('fires when recipient is unknown and amount exceeds $200', async () => {
    const result = await service.evaluate(
      makeReq({ recipientIsContact: false, usdEquivalentCents: 20001 }),
    );
    expect(result.fired).toBe(true);
    expect(result.score).toBe(50);
    expect(result.forceBlock).toBe(false);
  });

  it('uses amountCents as fallback when usdEquivalentCents is 0', async () => {
    const result = await service.evaluate(
      makeReq({
        recipientIsContact: false,
        usdEquivalentCents: 0,
        amountCents: 30000,
      }),
    );
    expect(result.fired).toBe(true);
  });
});
