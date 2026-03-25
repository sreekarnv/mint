import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import {
  DecisionEngineService,
  ScoreResponse,
} from './decision/decision-engine.service';
import { VelocityRuleService } from './rules/velocity-rule.service';
import { LargeAmountRuleService } from './rules/large-amount-rule.service';
import { NewRecipientRuleService } from './rules/new-recipient-rule.service';
import { GeoAnomalyRuleService } from './rules/geo-anomaly-rule.service';
import { NightLargeRuleService } from './rules/night-large-rule.service';
import { SanctionedRuleService } from './rules/sanctioned-rule.service';
import { ScoreRequest } from './rules/base-rule.service';

@Injectable()
export class FraudService {
  constructor(
    private prismaService: PrismaService,
    private decisionEngineService: DecisionEngineService,
    private velocityRuleService: VelocityRuleService,
    private largeAmountRuleService: LargeAmountRuleService,
    private newRecipientRuleService: NewRecipientRuleService,
    private geoAnomalyRuleService: GeoAnomalyRuleService,
    private nightLargeRuleService: NightLargeRuleService,
    private sanctionedRuleService: SanctionedRuleService,
  ) {}

  async evalute(req: ScoreRequest): Promise<ScoreResponse> {
    const results = await Promise.all([
      this.velocityRuleService.evaluate(req),
      this.largeAmountRuleService.evaluate(req),
      this.newRecipientRuleService.evaluate(req),
      this.geoAnomalyRuleService.evaluate(req),
      this.nightLargeRuleService.evaluate(req),
      this.sanctionedRuleService.evaluate(req),
    ]);

    const decision = this.decisionEngineService.decide(results);

    await this.prismaService.fraudCase.create({
      data: {
        transactionId: req.transactionId,
        userId: req.userId,
        decision: decision.decision,
        score: decision.score,
        rulesFired: decision.rulesFired,
      },
    });

    return decision;
  }

  async updateUserStats(userId: string, amountCents: number): Promise<void> {
    const amountSq = amountCents * amountCents;

    await this.prismaService.userTransferStats.upsert({
      where: { userId },
      create: {
        userId,
        count: 1,
        sumCents: amountCents,
        sumSqCents: amountSq,
      },
      update: {
        count: { increment: 1 },
        sumCents: { increment: amountCents },
        sumSqCents: { increment: amountSq },
        lastUpdated: new Date(),
      },
    });
  }
}
