import { BaseRuleService, RuleResult, ScoreRequest } from './base-rule.service';
import { PrismaService } from '../prisma/prisma.service';

export class LargeAmountRuleService extends BaseRuleService {
  private name: string = 'large_amount_deviation';

  constructor(private prismaService: PrismaService) {
    super();
  }

  async evaluate(req: ScoreRequest): Promise<RuleResult> {
    const stats = await this.prismaService.userTransferStats.findUnique({
      where: {
        userId: req.userId,
      },
    });

    if (!stats || Number(stats.count) < 5) {
      return this.notFired(this.name);
    }

    const count = Number(stats.count);
    const sum = Number(stats.sumCents);
    const sumSq = Number(stats.sumSqCents);

    const mean = sum / count;
    const variance = sumSq / count - mean * mean;
    const stddev = Math.sqrt(Math.max(variance, 0));

    const usdAmount = req.usdEquivalentCents || req.amountCents;

    if (usdAmount > mean + 3 * stddev) {
      return {
        name: this.name,
        fired: true,
        score: 60,
        forceBlock: false,
        reason: `Transfer of $${(usdAmount / 100).toFixed(2)} is unusually large compared to this user's typical transfer of $${(mean / 100).toFixed(2)}`,
      };
    }

    return this.notFired(this.name);
  }
}
