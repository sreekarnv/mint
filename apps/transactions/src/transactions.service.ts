import { getTraceHeaders, RedisService } from '@mint/common';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import type { ClientGrpc, ClientKafka } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { TopupDto } from './dto/topup.dto';
import type { TransferDto } from './dto/transfer.dto';
import { Prisma } from './generated/prisma/client';
import { TxnStatus, TxnType } from './generated/prisma/enums';
import { LimitService } from './limit/limit.service';
import { PrismaService } from './prisma/prisma.service';
import { StateMachineService } from './state-machine/state-machine.service';

interface FraudServiceClient {
  ScoreTransaction(data: {
    transactionId: string;
    userId: string;
    recipientId: string;
    amountCents: number;
    currency: string;
    senderCurrency: string;
    recipientCurrency: string;
    usdEquivalentCents: number;
    ipAddress: string;
    transactionType: string;
    userCountry: string;
    recipientIsContact: boolean;
  }): Observable<{
    decision: string;
    score: number;
    rulesFired: string[] | undefined;
    reason: string;
  }>;
}

interface KycServiceClient {
  GetLimits(data: { userId: string }): Observable<{
    perTxnCents: number;
    dailyCents: number;
    monthlyCents: number;
    limitsCurrency: string;
  }>;
}

interface WalletServiceClient {
  DebitWallet(data: {
    walletId: string;
    amountCents: number;
    transactionId: string;
  }): Observable<{ success: boolean; balanceAfter: number; error?: string }>;
  CreditWallet(data: {
    walletId: string;
    amountCents: number;
    transactionId: string;
  }): Observable<{ success: boolean; balanceAfter: number; error?: string }>;
  GetWallet(data: { userId: string }): Observable<{
    id: string;
    userId: string;
    balance: number;
    currency: string;
    status: string;
    isDefault: boolean;
  }>;
}

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);
  private fraudClient: FraudServiceClient;
  private kycClient: KycServiceClient;
  private walletClient: WalletServiceClient;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly limitService: LimitService,
    private readonly stateMachine: StateMachineService,
    @Inject('FRAUD_CLIENT') private readonly fraudGrpc: ClientGrpc,
    @Inject('KYC_CLIENT') private readonly kycGrpc: ClientGrpc,
    @Inject('WALLET_CLIENT') private readonly walletGrpc: ClientGrpc,
    @Inject('KAFKA_PRODUCER') private readonly kafka: ClientKafka,
  ) {
    this.fraudClient =
      this.fraudGrpc.getService<FraudServiceClient>('FraudService');
    this.kycClient = this.kycGrpc.getService<KycServiceClient>('KycService');
    this.walletClient =
      this.walletGrpc.getService<WalletServiceClient>('WalletService');
  }

  async transfer(
    dto: TransferDto,
    userId: string,
    idempotencyKey: string,
    ipAddress: string,
  ) {
    this.logger.log(
      `Transfer initiated: ${userId} => ${dto.recipientId}, ${dto.amount} cents`,
    );

    const [senderWallet, recipientWallet] = await Promise.all([
      firstValueFrom(this.walletClient.GetWallet({ userId })),
      firstValueFrom(this.walletClient.GetWallet({ userId: dto.recipientId })),
    ]);

    let txn: Awaited<ReturnType<typeof this.prisma.transaction.create>>;
    try {
      txn = await this.prisma.transaction.create({
        data: {
          idempotencyKey,
          type: TxnType.TRANSFER,
          status: TxnStatus.PENDING,
          senderId: userId,
          recipientId: dto.recipientId,
          senderWallet: senderWallet.id,
          recipientWallet: recipientWallet.id,
          senderAmount: BigInt(dto.amount),
          senderCurrency: dto.senderCurrency,
          recipientCurrency: dto.recipientCurrency || dto.senderCurrency,
          description: dto.description,
          merchant: dto.merchant,
          category: dto.category,
        },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        this.logger.warn(
          `Duplicate idempotency key "${idempotencyKey}" for transfer - returning existing transaction`,
        );
        const existing = await this.prisma.transaction.findUnique({
          where: { idempotencyKey },
        });
        if (existing) {
          return {
            id: existing.id,
            status: existing.status,
            amount: Number(existing.senderAmount),
            currency: existing.senderCurrency,
            recipientId: existing.recipientId,
            createdAt: existing.createdAt,
            completedAt: existing.completedAt,
          };
        }
      }
      throw err;
    }

    this.logger.log(`Transaction created: ${txn.id}, status: PENDING`);

    try {
      await this.limitService.checkAll(userId, dto.amount);
      this.logger.log(`Limits check passed for ${userId}`);

      const usdEquivalent = await this.computeUsdEquivalent(
        dto.amount,
        dto.senderCurrency,
      );

      const isContact = await this.redis.sismember(
        `contact:${userId}`,
        dto.recipientId,
      );

      const fraudResult = await firstValueFrom(
        this.fraudClient.ScoreTransaction({
          transactionId: txn.id,
          userId,
          recipientId: dto.recipientId,
          amountCents: dto.amount,
          currency: dto.senderCurrency,
          senderCurrency: dto.senderCurrency,
          recipientCurrency: dto.recipientCurrency || dto.senderCurrency,
          usdEquivalentCents: usdEquivalent,
          ipAddress,
          transactionType: 'TRANSFER',
          userCountry: 'US', // TODO: Get from user profile
          recipientIsContact: !!isContact,
        }),
      );

      this.logger.log(
        `Fraud check: ${fraudResult.decision}, score: ${fraudResult.score}, rules: ${(fraudResult.rulesFired ?? []).join(', ')}`,
      );

      if (fraudResult.decision === 'BLOCK') {
        await this.prisma.transaction.update({
          where: { id: txn.id },
          data: {
            status: TxnStatus.FAILED,
            fraudDecision: 'BLOCK',
            fraudScore: fraudResult.score,
          },
        });

        // Publish fraud_blocked event
        this.emitEvent(
          'transaction.events',
          {
            event: 'transaction.fraud_blocked',
            transactionId: txn.id,
            userId,
            amount: dto.amount,
            rulesFired: fraudResult.rulesFired ?? [],
            score: fraudResult.score,
          },
          userId,
        );

        throw new ForbiddenException(
          `Transaction blocked: ${fraudResult.reason}`,
        );
      }

      await this.prisma.transaction.update({
        where: { id: txn.id },
        data: {
          status: TxnStatus.PROCESSING,
          processingAt: new Date(),
          fraudDecision: fraudResult.decision,
          fraudScore: fraudResult.score,
        },
      });

      this.logger.log(`Transaction ${txn.id} => PROCESSING`);

      let recipientAmount = dto.amount;
      let fxRate: string | null = null;
      let fxRateLockedAt: Date | null = null;

      if (
        dto.senderCurrency !== (dto.recipientCurrency || dto.senderCurrency)
      ) {
        // TODO: Call wallet-service FX rate API
        fxRate = '1.0';
        fxRateLockedAt = new Date();
        recipientAmount = dto.amount;

        await this.prisma.transaction.update({
          where: { id: txn.id },
          data: {
            recipientAmount: BigInt(recipientAmount),
            fxRate,
            fxRateLockedAt,
          },
        });

        this.logger.log(`FX rate locked: ${fxRate} at ${fxRateLockedAt}`);
      }

      const debitResult = await this.debitWallet(
        senderWallet.id,
        dto.amount,
        txn.id,
      );

      if (!debitResult.success) {
        await this.prisma.transaction.update({
          where: { id: txn.id },
          data: { status: TxnStatus.FAILED },
        });

        throw new BadRequestException(
          debitResult.error || 'Insufficient funds',
        );
      }

      this.logger.log(`Debited ${dto.amount} from ${userId}'s wallet`);

      const creditResult = await this.creditWallet(
        recipientWallet.id,
        recipientAmount,
        txn.id,
      );

      if (!creditResult.success) {
        this.logger.error(
          `CRITICAL: Debited sender but failed to credit recipient for ${txn.id}. Attempting rollback...`,
        );

        try {
          await this.creditWallet(
            senderWallet.id,
            dto.amount,
            `${txn.id}-rollback`,
          );
          this.logger.log(`Rollback successful for ${txn.id}`);
        } catch (rollbackError) {
          this.logger.error(
            `ROLLBACK FAILED for ${txn.id}! Manual intervention required.`,
            rollbackError,
          );
        }

        await this.prisma.transaction.update({
          where: { id: txn.id },
          data: { status: TxnStatus.FAILED },
        });

        throw new Error('Transaction failed: unable to complete transfer');
      }

      this.logger.log(
        `Credited ${recipientAmount} to ${dto.recipientId}'s wallet`,
      );

      const completed = await this.prisma.transaction.update({
        where: { id: txn.id },
        data: {
          status: TxnStatus.COMPLETED,
          completedAt: new Date(),
        },
      });

      this.logger.log(`Transaction ${txn.id} => COMPLETED`);

      this.emitEvent(
        'transaction.events',
        {
          event: 'transaction.completed',
          transactionId: completed.id,
          type: completed.type,
          senderId: completed.senderId,
          recipientId: completed.recipientId,
          senderAmount: Number(completed.senderAmount),
          senderCurrency: completed.senderCurrency,
          recipientAmount: completed.recipientAmount
            ? Number(completed.recipientAmount)
            : null,
          recipientCurrency: completed.recipientCurrency,
          description: completed.description,
          merchant: completed.merchant,
          category: completed.category,
          fraudDecision: completed.fraudDecision,
          fraudScore: completed.fraudScore,
          completedAt: completed.completedAt?.toISOString(),
        },
        userId,
      );

      // Record transaction in limit counters (no rollback possible here)
      await this.limitService.recordTransaction(userId, dto.amount);

      return {
        id: completed.id,
        status: completed.status,
        amount: Number(completed.senderAmount),
        currency: completed.senderCurrency,
        recipientId: completed.recipientId,
        createdAt: completed.createdAt,
        completedAt: completed.completedAt,
      };
    } catch (error) {
      this.logger.error(
        `Transfer failed for ${txn.id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getTransaction(txnId: string, userId: string) {
    const txn = await this.prisma.transaction.findUnique({
      where: { id: txnId },
    });

    if (!txn) {
      throw new BadRequestException('Transaction not found');
    }

    if (txn.senderId !== userId && txn.recipientId !== userId) {
      throw new ForbiddenException('Not authorized to view this transaction');
    }

    return {
      id: txn.id,
      type: txn.type,
      status: txn.status,
      amount: Number(txn.senderAmount),
      currency: txn.senderCurrency,
      description: txn.description,
      senderId: txn.senderId,
      recipientId: txn.recipientId,
      fraudDecision: txn.fraudDecision,
      fraudScore: txn.fraudScore,
      createdAt: txn.createdAt,
      completedAt: txn.completedAt,
    };
  }
  async listTransactions(userId: string, limit: number = 20, cursor?: string) {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        OR: [{ senderId: userId }, { recipientId: userId }],
        ...(cursor ? { id: { lt: cursor } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return transactions.map((txn) => ({
      id: txn.id,
      type: txn.type,
      status: txn.status,
      amount: Number(txn.senderAmount),
      currency: txn.senderCurrency,
      description: txn.description,
      senderId: txn.senderId,
      recipientId: txn.recipientId,
      createdAt: txn.createdAt,
      completedAt: txn.completedAt,
    }));
  }

  async adminListTransactions(params: {
    limit: number;
    cursor?: string;
    userId?: string;
    status?: string;
  }) {
    const { limit, cursor, userId, status } = params;
    const transactions = await this.prisma.transaction.findMany({
      where: {
        ...(userId ? { OR: [{ senderId: userId }, { recipientId: userId }] } : {}),
        ...(status ? { status: status as TxnStatus } : {}),
        ...(cursor ? { id: { lt: cursor } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return transactions.map((txn) => ({
      id: txn.id,
      type: txn.type,
      status: txn.status,
      amount: Number(txn.senderAmount),
      currency: txn.senderCurrency,
      description: txn.description,
      senderId: txn.senderId,
      recipientId: txn.recipientId,
      fraudDecision: txn.fraudDecision,
      fraudScore: txn.fraudScore,
      createdAt: txn.createdAt,
      completedAt: txn.completedAt,
    }));
  }

  async topup(dto: TopupDto, userId: string, idempotencyKey: string) {
    this.logger.log(
      `Topup initiated: ${userId}, ${dto.amount} ${dto.currency}`,
    );

    const wallet = await firstValueFrom(
      this.walletClient.GetWallet({ userId }),
    );

    let txn: Awaited<ReturnType<typeof this.prisma.transaction.create>>;
    try {
      txn = await this.prisma.transaction.create({
        data: {
          idempotencyKey,
          type: TxnType.TOPUP,
          status: TxnStatus.PENDING,
          senderId: userId,
          senderWallet: wallet.id,
          senderAmount: BigInt(dto.amount),
          senderCurrency: dto.currency,
          description: dto.description,
        },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        this.logger.warn(
          `Duplicate idempotency key "${idempotencyKey}" for topup - returning existing transaction`,
        );
        const existing = await this.prisma.transaction.findUnique({
          where: { idempotencyKey },
        });
        if (existing) {
          return {
            id: existing.id,
            status: existing.status,
            amount: Number(existing.senderAmount),
            currency: existing.senderCurrency,
          };
        }
      }
      throw err;
    }

    const creditResult = await this.creditWallet(wallet.id, dto.amount, txn.id);

    if (!creditResult.success) {
      await this.prisma.transaction.update({
        where: { id: txn.id },
        data: { status: TxnStatus.FAILED },
      });
      throw new BadRequestException(
        creditResult.error || 'Topup failed: wallet credit error',
      );
    }

    await this.prisma.transaction.update({
      where: { id: txn.id },
      data: {
        status: TxnStatus.COMPLETED,
        completedAt: new Date(),
      },
    });

    this.emitEvent(
      'transaction.events',
      {
        event: 'transaction.completed',
        transactionId: txn.id,
        type: txn.type,
        senderId: txn.senderId,
        senderAmount: Number(txn.senderAmount),
        senderCurrency: txn.senderCurrency,
        completedAt: new Date(),
      },
      userId,
    );

    return {
      id: txn.id,
      status: TxnStatus.COMPLETED,
      amount: Number(txn.senderAmount),
      currency: txn.senderCurrency,
    };
  }

  //TODO: Call wallet-service FX rate API
  private async computeUsdEquivalent(
    amountCents: number,
    currency: string,
  ): Promise<number> {
    if (currency === 'USD') return amountCents;

    // TODO: Fetch rate from wallet-service (For now return 1:!)
    return amountCents;
  }

  private async debitWallet(
    walletId: string,
    amountCents: number,
    transactionId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await firstValueFrom(
        this.walletClient.DebitWallet({
          walletId,
          amountCents,
          transactionId,
        }),
      );
      if (result.success) {
        this.logger.log(
          `DebitWallet successful: ${walletId}, new balance: ${result.balanceAfter}`,
        );
      }
      return { success: result.success, error: result.error };
    } catch (error) {
      this.logger.error(`DebitWallet gRPC failed: ${error.message}`);
      return { success: false, error: error.message || 'Wallet debit failed' };
    }
  }

  private async creditWallet(
    walletId: string,
    amountCents: number,
    transactionId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await firstValueFrom(
        this.walletClient.CreditWallet({
          walletId,
          amountCents,
          transactionId,
        }),
      );
      if (result.success) {
        this.logger.log(
          `CreditWallet successful: ${walletId}, new balance: ${result.balanceAfter}`,
        );
      }
      return { success: result.success, error: result.error };
    } catch (error) {
      this.logger.error(`CreditWallet gRPC failed: ${error.message}`);
      return { success: false, error: error.message || 'Wallet credit failed' };
    }
  }

  private emitEvent(
    topic: string,
    payload: Record<string, any>,
    actorId: string,
  ): void {
    this.kafka.emit(topic, {
      headers: getTraceHeaders(),
      value: {
        topic,
        eventId: uuidv4(),
        timestamp: new Date().toISOString(),
        version: '1',
        service: 'transactions-service',
        actorId,
        payload,
      },
    });
  }
}
