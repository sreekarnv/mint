import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { BullModule } from '@nestjs/bullmq';
import { CommonModule } from '@mint/common';
import { PrismaService } from './prisma/prisma.service';
import { ClassificationService } from './classification/classification.service';
import { BudgetService } from './budget/budget.service';
import { InsightsService } from './insights/insights.service';
import { InsightsController } from './insights/insights.controller';
import { AnalyticsKafkaController } from './kafka/analytics-kafka.controller';
import { NightlyAggregationProcessor } from './jobs/nightly-aggregation.processor';

function parseRedisUrl(url: string): { host: string; port: number } {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port || '6379'),
  };
}

@Module({
  imports: [
    CommonModule,
    ClientsModule.register([
      {
        name: 'KAFKA_PRODUCER',
        transport: Transport.KAFKA,
        options: {
          client: { brokers: [process.env.KAFKA_BROKERS!] },
        },
      },
    ]),
    BullModule.forRoot({
      connection: parseRedisUrl(
        process.env.REDIS_URL || 'redis://localhost:6379',
      ),
    }),
    BullModule.registerQueue({ name: 'analytics-nightly' }),
  ],
  controllers: [InsightsController, AnalyticsKafkaController],
  providers: [
    PrismaService,
    ClassificationService,
    BudgetService,
    InsightsService,
    NightlyAggregationProcessor,
  ],
})
export class AnalyticsModule {}
