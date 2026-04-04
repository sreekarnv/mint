import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { RedisService } from '@mint/common';
import { PrismaService } from '../prisma/prisma.service';
import { Category } from '../generated/prisma/enums';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class BudgetService {
  private readonly logger = new Logger(BudgetService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    @Inject('KAFKA_PRODUCER') private readonly kafka: ClientKafka,
  ) {}

  async checkThreshold(
    userId: string,
    category: Category,
    amountCents: number,
  ): Promise<void> {
    const budget = await this.prisma.budget.findUnique({
      where: { userId_category: { userId, category } },
    });

    if (!budget || !budget.active) return;

    const yearMonth = new Date().toISOString().slice(0, 7);
    const redisKey = `analytics:budget:${userId}:${category}:${yearMonth}`;

    const newTotal = await this.redis.incrby(redisKey, amountCents);

    if (newTotal === amountCents) {
      await this.redis.expire(redisKey, this.getSecondsToEndOfMonth());
    }

    const ratio = newTotal / Number(budget.limitCents);

    const warned80Key = `analytics:warned80:${userId}:${category}:${yearMonth}`;
    if (ratio >= 0.8 && !(await this.redis.get(warned80Key))) {
      await this.redis.set(warned80Key, '1', this.getSecondsToEndOfMonth());
      this.emitEvent(
        'analytics.events',
        {
          event: 'analytics.budget_warning',
          userId,
          category,
          used: newTotal,
          limit: Number(budget.limitCents),
          ratio: 0.8,
          yearMonth,
        },
        userId,
      );
      this.logger.log(
        `Budget warning: ${userId} ${category} at 80% (${newTotal}/${budget.limitCents})`,
      );
    }

    const warned100Key = `analytics:warned100:${userId}:${category}:${yearMonth}`;
    if (ratio >= 1.0 && !(await this.redis.get(warned100Key))) {
      await this.redis.set(warned100Key, '1', this.getSecondsToEndOfMonth());
      this.emitEvent(
        'analytics.events',
        {
          event: 'analytics.budget_exceeded',
          userId,
          category,
          used: newTotal,
          limit: Number(budget.limitCents),
          yearMonth,
        },
        userId,
      );
      this.logger.warn(
        `Budget exceeded: ${userId} ${category} (${newTotal}/${budget.limitCents})`,
      );
    }
  }

  private getSecondsToEndOfMonth(): number {
    const endOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      1,
    );
    return Math.floor((endOfMonth.getTime() - Date.now()) / 1000);
  }

  private emitEvent(
    topic: string,
    payload: Record<string, any>,
    actorId: string,
  ): void {
    this.kafka.emit(topic, {
      topic,
      eventId: uuidv4(),
      timestamp: new Date().toISOString(),
      version: '1',
      service: 'analytics-service',
      actorId,
      payload,
    });
  }
}
