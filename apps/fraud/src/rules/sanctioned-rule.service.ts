import { RedisService } from '@mint/common';
import { BaseRuleService, RuleResult, ScoreRequest } from './base-rule.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SanctionedRuleService extends BaseRuleService {
  private name: string = 'sanctioned_recipient';

  constructor(private redisService: RedisService) {
    super();
  }

  async evaluate(req: ScoreRequest): Promise<RuleResult> {
    const isSanctioned = await this.redisService.sismember(
      'fraud:sanctions',
      req.recipientId,
    );

    if (!isSanctioned) {
      return this.notFired(this.name);
    }

    return {
      name: this.name,
      fired: true,
      score: 100,
      forceBlock: true,
      reason: `recipient ${req.recipientId} is on sanctions list`,
    };
  }
}
