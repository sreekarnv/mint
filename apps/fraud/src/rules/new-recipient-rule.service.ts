import { Injectable } from '@nestjs/common';
import { BaseRuleService, RuleResult, ScoreRequest } from './base-rule.service';

@Injectable()
export class NewRecipientRuleService extends BaseRuleService {
  private TWO_HUNDRED_USD_CENTS: number = 20000;
  private name: string = 'new_recipient_large';

  async evaluate(req: ScoreRequest): Promise<RuleResult> {
    const usdAmount = req.usdEquivalentCents || req.amountCents;

    if (!req.recipientIsContact && usdAmount > this.TWO_HUNDRED_USD_CENTS) {
      return {
        name: this.name,
        fired: true,
        score: 50,
        forceBlock: false,
        reason: `Large transfer ($${usdAmount / 100}) to unknown recipient`,
      };
    }

    return this.notFired(this.name);
  }
}
