import { Injectable } from '@nestjs/common';
import { RuleResult } from '../rules/base-rule.service';

export interface ScoreResponse {
  decision: string;
  score: number;
  rulesFired: string[];
  reason: string;
}

const BLOCK_THRESHOLD = parseInt(process.env.FRAUD_BLOCK_THRESHOLD ?? '100');
const REVIEW_THRESHOLD = parseInt(process.env.FRAUD_REVIEW_THRESHOLD ?? '50');

@Injectable()
export class DecisionEngineService {
  decide(results: RuleResult[]): ScoreResponse {
    const fired = results.filter((r) => r.fired);
    const score = fired.reduce((sum, r) => sum + r.score, 0);
    const names = fired.map((r) => r.name);

    const blockingRule = fired.find((r) => r.forceBlock);

    if (blockingRule) {
      return {
        decision: 'BLOCK',
        score,
        rulesFired: names,
        reason: blockingRule.reason,
      };
    }

    if (score >= BLOCK_THRESHOLD) {
      return {
        decision: 'BLOCK',
        score,
        rulesFired: names,
        reason: 'Score threshold reached',
      };
    }

    if (score >= REVIEW_THRESHOLD) {
      return {
        decision: 'REVIEW',
        score,
        rulesFired: names,
        reason: 'Requires manual review',
      };
    }

    return { decision: 'ALLOW', score, rulesFired: [], reason: '' };
  }
}
