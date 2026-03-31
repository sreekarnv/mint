import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { RedisService } from '@mint/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';

interface KycServiceClient {
  GetLimits(data: { userId: string }): Observable<{
    perTxnCents: number;
    dailyCents: number;
    monthlyCents: number;
    limitsCurrency: string;
  }>;
}

@Injectable()
export class LimitService {
  private kycClient: KycServiceClient;

  constructor(
    private readonly redisService: RedisService,
    @Inject('KYC_CLIENT') private readonly kycGrpc: ClientGrpc,
  ) {
    this.kycClient = this.kycGrpc.getService<KycServiceClient>('KycService');
  }

  async checkAll(userId: string, amountCents: number): Promise<void> {
    const limits = await firstValueFrom(this.kycClient.GetLimits({ userId }));

    if (amountCents > limits.perTxnCents) {
      throw new BadRequestException(
        `Amount $${amountCents / 100} exceeds per-transaction limit of $${limits.perTxnCents / 100}`,
      );
    }

    await this.checkDailyLimit(userId, amountCents, limits.dailyCents);
    await this.checkMonthlyLimit(userId, amountCents, limits.monthlyCents);
  }

  private async checkDailyLimit(
    userId: string,
    amountCents: number,
    limitCents: number,
  ): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const key = `limit:daily:${userId}:${today}`;

    const newTotal = await this.redisService.incrby(key, amountCents);

    if (newTotal === amountCents) {
      await this.redisService.expire(key, 86400);
    }

    if (newTotal > limitCents) {
      await this.redisService.decrby(key, amountCents);
      throw new BadRequestException(
        `Daily limit exceeded: $${newTotal / 100} > $${limitCents / 100}`,
      );
    }
  }

  private async checkMonthlyLimit(
    userId: string,
    amountCents: number,
    limitCents: number,
  ): Promise<void> {
    const yearMonth = new Date().toISOString().slice(0, 7);
    const key = `limit:monthly:${userId}:${yearMonth}`;

    const newTotal = await this.redisService.incrby(key, amountCents);

    if (newTotal === amountCents) {
      const endOfMonth = new Date(
        new Date().getFullYear(),
        new Date().getMonth() + 1,
        1,
      );
      const secondsUntilEndOfMonth = Math.floor(
        (endOfMonth.getTime() - Date.now()) / 1000,
      );
      await this.redisService.expire(key, secondsUntilEndOfMonth);
    }

    if (newTotal > limitCents) {
      await this.redisService.decrby(key, amountCents);
      throw new BadRequestException(
        `Monthly limit exceeded: $${newTotal / 100} > $${limitCents / 100}`,
      );
    }
  }

  async recordTransaction(userId: string, amountCents: number): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const yearMonth = new Date().toISOString().slice(0, 7);

    await this.redisService.incrby(
      `limit:daily:${userId}:${today}`,
      amountCents,
    );
    await this.redisService.incrby(
      `limit:monthly:${userId}:${yearMonth}`,
      amountCents,
    );
  }
}
