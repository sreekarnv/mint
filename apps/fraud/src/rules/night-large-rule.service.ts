import { Injectable } from '@nestjs/common';
import { BaseRuleService, RuleResult, ScoreRequest } from './base-rule.service';

@Injectable()
export class NightLargeRuleService extends BaseRuleService {
  private name: string = 'night_large';
  private FIVE_HUNDRED_USD_CENTS: number = 50000;

  async evaluate(req: ScoreRequest): Promise<RuleResult> {
    const usdAmount = req.usdEquivalentCents || req.amountCents;

    if (usdAmount <= this.FIVE_HUNDRED_USD_CENTS) {
      return this.notFired(this.name);
    }

    const hour = new Date().getUTCHours();

    if (!(hour >= 0 && hour < 5)) {
      return this.notFired(this.name);
    }

    return {
      name: this.name,
      fired: true,
      score: 30,
      forceBlock: false,
      reason: `Large transfer ($${usdAmount / 100}) during night hours (UTC ${hour}:00)`,
    };
  }
}
