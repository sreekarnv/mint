import { Module } from '@nestjs/common';
import { FraudController } from './fraud.controller';
import { FraudService } from './fraud.service';
import { PrismaService } from './prisma/prisma.service';
import { DecisionEngineService } from './decision/decision-engine.service';
import { VelocityRuleService } from './rules/velocity-rule.service';
import { LargeAmountRuleService } from './rules/large-amount-rule.service';
import { NewRecipientRuleService } from './rules/new-recipient-rule.service';
import { GeoAnomalyRuleService } from './rules/geo-anomaly-rule.service';
import { NightLargeRuleService } from './rules/night-large-rule.service';
import { SanctionedRuleService } from './rules/sanctioned-rule.service';
import { FraudKafkaController } from './fraud-kafka.controller';
import { CommonModule } from '@mint/common';

@Module({
  imports: [CommonModule],
  controllers: [FraudController, FraudKafkaController],
  providers: [
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
