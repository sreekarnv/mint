import { Module } from '@nestjs/common';
import { FraudController } from './fraud.controller';
import { FraudService } from './fraud.service';
import { PrismaService } from './prisma/prisma.service';
import { RedisService } from '@mint/common/services/redis.service';
import { DecisionEngineService } from './decision/decision-engine.service';
import { VelocityRuleService } from './rules/velocity-rule.service';
import { LargeAmountRuleService } from './rules/large-amount-rule.service';
import { NewRecipientRuleService } from './rules/new-recipient-rule.service';
import { GeoAnomalyRuleService } from './rules/geo-anomaly-rule.service';
import { NightLargeRuleService } from './rules/night-large-rule.service';
import { SanctionedRuleService } from './rules/sanctioned-rule.service';

@Module({
  imports: [],
  controllers: [FraudController],
  providers: [
    RedisService,
    PrismaService,
    FraudService,
    DecisionEngineService,
    VelocityRuleService,
    LargeAmountRuleService,
    NewRecipientRuleService,
    GeoAnomalyRuleService,
    NightLargeRuleService,
    SanctionedRuleService,
  ],
})
export class FraudModule {}
