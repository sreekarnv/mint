import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class FraudService {
  constructor(private prisma: PrismaService) {}

  async updateUserStats(userId: string, amountCents: number): Promise<void> {
    const amountSq = amountCents * amountCents;

    await this.prisma.userTransferStats.upsert({
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
