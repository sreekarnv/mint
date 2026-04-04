import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InsightsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMonthlyInsights(userId: string) {
    const yearMonth = new Date().toISOString().slice(0, 7);

    const aggregates = await this.prisma.monthlyAggregate.findMany({
      where: { userId, yearMonth },
      orderBy: { totalCents: 'desc' },
    });

    const total = aggregates.reduce(
      (sum, agg) => sum + Number(agg.totalCents),
      0,
    );

    return {
      yearMonth,
      total,
      categories: aggregates.map((agg) => ({
        category: agg.category,
        total: Number(agg.totalCents),
        count: agg.count,
        percentage: total > 0 ? (Number(agg.totalCents) / total) * 100 : 0,
      })),
    };
  }

  async getTopMerchants(userId: string, limit: number = 10) {
    const yearMonth = new Date().toISOString().slice(0, 7);

    const events = await this.prisma.spendEvent.findMany({
      where: { userId, yearMonth, merchant: { not: null } },
      select: { merchant: true, baseAmountCents: true },
    });

    const merchantTotals = events.reduce(
      (acc, event) => {
        const merchant = event.merchant!;
        acc[merchant] = (acc[merchant] || 0) + Number(event.baseAmountCents);
        return acc;
      },
      {} as Record<string, number>,
    );

    return Object.entries(merchantTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([merchant, total]) => ({ merchant, total }));
  }
}
