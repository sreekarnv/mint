import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { PrismaService } from '../prisma/prisma.service';
import { ClassificationService } from '../classification/classification.service';
import { BudgetService } from '../budget/budget.service';

@Controller()
export class AnalyticsKafkaController {
  private readonly logger = new Logger(AnalyticsKafkaController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly classifier: ClassificationService,
    private readonly budgetService: BudgetService,
  ) {}

  @EventPattern('transaction.events')
  async handleTransactionEvents(@Payload() envelope: any): Promise<void> {
    const event = envelope?.payload?.event;

    if (event !== 'transaction.completed') return;

    const p = envelope.payload;

    if (p.type === 'TOPUP') return;

    try {
      const category = this.classifier.classify(p.description, p.merchant);

      const baseCurrency = 'USD';
      const baseAmountCents = Number(p.senderAmount || p.amount);
      const yearMonth = new Date(p.completedAt || envelope.timestamp)
        .toISOString()
        .slice(0, 7);

      await this.prisma.spendEvent.upsert({
        where: { transactionId: p.transactionId },
        create: {
          transactionId: p.transactionId,
          userId: p.senderId,
          amountCents: BigInt(baseAmountCents),
          originalCurrency: p.senderCurrency || 'USD',
          baseCurrency,
          baseAmountCents: BigInt(baseAmountCents),
          category,
          merchant: p.merchant || null,
          occurredAt: new Date(p.completedAt || envelope.timestamp),
          yearMonth,
        },
        update: {},
      });

      await this.prisma.monthlyAggregate.upsert({
        where: {
          userId_yearMonth_category: {
            userId: p.senderId,
            yearMonth,
            category,
          },
        },
        create: {
          userId: p.senderId,
          yearMonth,
          category,
          totalCents: BigInt(baseAmountCents),
          count: 1,
        },
        update: {
          totalCents: { increment: BigInt(baseAmountCents) },
          count: { increment: 1 },
        },
      });

      await this.budgetService.checkThreshold(
        p.senderId,
        category,
        baseAmountCents,
      );

      this.logger.log(
        `Processed transaction ${p.transactionId}: ${category}, $${baseAmountCents / 100}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process transaction ${p.transactionId}: ${error.message}`,
      );
    }
  }
}
