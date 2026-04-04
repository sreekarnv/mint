import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { Category } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';

@Processor('analytics-nightly')
export class NightlyAggregationProcessor extends WorkerHost {
  private readonly logger = new Logger(NightlyAggregationProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job): Promise<void> {
    const yearMonth = new Date().toISOString().slice(0, 7);

    this.logger.log(`Starting nightly aggregation for ${yearMonth}`);

    const userIds = await this.prisma.spendEvent
      .findMany({
        where: { yearMonth },
        distinct: ['userId'],
        select: { userId: true },
      })
      .then((results) => results.map((r) => r.userId));

    this.logger.log(`Processing ${userIds.length} users`);

    for (const userId of userIds) {
      const events = await this.prisma.spendEvent.findMany({
        where: { userId, yearMonth },
      });

      const aggregatesByCategory = events.reduce(
        (acc, event) => {
          if (!acc[event.category]) {
            acc[event.category] = { totalCents: 0n, count: 0 };
          }
          acc[event.category].totalCents += event.baseAmountCents;
          acc[event.category].count += 1;
          return acc;
        },
        {} as Record<string, { totalCents: bigint; count: number }>,
      );

      for (const [category, data] of Object.entries(aggregatesByCategory)) {
        await this.prisma.monthlyAggregate.upsert({
          where: {
            userId_yearMonth_category: {
              userId,
              yearMonth,
              category: category as Category,
            },
          },
          create: {
            userId,
            yearMonth,
            category: category as Category,
            totalCents: data.totalCents,
            count: data.count,
          },
          update: {
            totalCents: data.totalCents,
            count: data.count,
          },
        });
      }
    }

    this.logger.log('Nightly aggregation complete');
  }
}
