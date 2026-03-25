export interface ScoreRequest {
  transactionId: string;
  userId: string;
  recipientId: string;
  amountCents: number;
  currency: string;
  ipAddress: string;
  transactionType: string;
  userCountry: string;
  recipientIsContact: boolean;
  senderCurrency: string;
  recipientCurrency: string;
  usdEquivalentCents: number;
}

export interface RuleResult {
  name: string;
  fired: boolean;
  score: number;
  forceBlock: boolean;
  reason: string;
}

export abstract class BaseRuleService {
  abstract evaluate(req: ScoreRequest): Promise<RuleResult>;

  protected notFired(name: string): RuleResult {
    return { name, fired: false, score: 0, forceBlock: false, reason: '' };
  }
}
