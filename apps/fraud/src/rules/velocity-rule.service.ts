import { RedisService } from '@mint/common';
import { BaseRuleService, RuleResult, ScoreRequest } from './base-rule.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class VelocityRuleService extends BaseRuleService {
  private name: string = 'velocity_breach';

  constructor(private redisService: RedisService) {
    super();
  }

  async evaluate(req: ScoreRequest): Promise<RuleResult> {
    const key = `fraud:velocity:${req.userId}`;
    const count = await this.redisService.incr(key);

    if (count === 1) {
      await this.redisService.expire(key, 3600);
    }

    if (count > 5) {
      return {
        name: this.name,
        fired: true,
        score: 100,
        forceBlock: true,
        reason: `user made ${count} transfer in 60 minutes`,
      };
    }

    return this.notFired(this.name);
  }
}
