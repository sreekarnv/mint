import { RuleResult } from '../rules/base-rule.service';
import { DecisionEngineService } from './decision-engine.service';

function makeResult(overrides: Partial<RuleResult> = {}): RuleResult {
  return {
    name: 'test_rule',
    fired: false,
    score: 0,
    forceBlock: false,
    reason: '',
    ...overrides,
  };
}

describe('DecisionEngineService', () => {
  let service: DecisionEngineService;

  beforeEach(() => {
    service = new DecisionEngineService();
  });

  it('returns ALLOW when no rules fire', () => {
    const result = service.decide([
      makeResult(),
      makeResult({ name: 'other' }),
    ]);
    expect(result.decision).toBe('ALLOW');
    expect(result.score).toBe(0);
    expect(result.rulesFired).toEqual([]);
  });

  it('returns REVIEW when score reaches REVIEW_THRESHOLD (50)', () => {
    const result = service.decide([
      makeResult({ name: 'new_recipient_large', fired: true, score: 50 }),
    ]);
    expect(result.decision).toBe('REVIEW');
    expect(result.score).toBe(50);
    expect(result.rulesFired).toContain('new_recipient_large');
  });

  it('returns BLOCK when score reaches BLOCK_THRESHOLD (100)', () => {
    const result = service.decide([
      makeResult({ name: 'large_amount', fired: true, score: 60 }),
      makeResult({ name: 'new_recipient', fired: true, score: 50 }),
    ]);
    expect(result.decision).toBe('BLOCK');
    expect(result.score).toBe(110);
  });

  it('returns BLOCK immediately when a forceBlock rule fires, regardless of score', () => {
    const result = service.decide([
      makeResult({
        name: 'velocity_breach',
        fired: true,
        score: 100,
        forceBlock: true,
        reason: 'too fast',
      }),
      makeResult({ name: 'small_rule', fired: false, score: 0 }),
    ]);
    expect(result.decision).toBe('BLOCK');
    expect(result.reason).toBe('too fast');
  });

  it('includes only fired rule names in rulesFired', () => {
    const result = service.decide([
      makeResult({ name: 'fired_rule', fired: true, score: 60 }),
      makeResult({ name: 'quiet_rule', fired: false, score: 0 }),
    ]);
    expect(result.rulesFired).toEqual(['fired_rule']);
  });

  it('sums scores from all fired rules', () => {
    const result = service.decide([
      makeResult({ name: 'r1', fired: true, score: 30 }),
      makeResult({ name: 'r2', fired: true, score: 40 }),
      makeResult({ name: 'r3', fired: false, score: 60 }),
    ]);
    expect(result.score).toBe(70);
  });
});
