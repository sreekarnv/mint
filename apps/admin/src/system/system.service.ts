import { RedisService } from '@mint/common';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SystemService implements OnModuleInit {
  private readonly logger = new Logger(SystemService.name);

  constructor(
    private readonly redis: RedisService,
    @Inject('KAFKA_PRODUCER') private readonly kafka: ClientKafka,
  ) {}

  async onModuleInit() {
    await this.kafka.connect();
  }

  async getLimits() {
    const limits = await this.redis.get('system:kyc_limits');

    if (!limits) {
      return {
        UNVERIFIED: {
          perTxnCents: 5000,
          dailyCents: 10000,
          monthlyCents: 20000,
        },
        BASIC: {
          perTxnCents: 50000,
          dailyCents: 200000,
          monthlyCents: 1000000,
        },
        VERIFIED: {
          perTxnCents: 1000000,
          dailyCents: 5000000,
          monthlyCents: 20000000,
        },
      };
    }

    return JSON.parse(limits);
  }

  async updateLimits(adminId: string, limits: Record<string, any>) {
    this.logger.warn(`Admin ${adminId} updating KYC tier limits`);

    await this.redis.set('system:kyc_limits', JSON.stringify(limits));

    this.emitAuditEvent('admin.limits_updated', adminId, {
      updatedBy: adminId,
      newLimits: limits,
    });

    return { success: true, limits };
  }

  private emitAuditEvent(
    action: string,
    adminId: string,
    data: Record<string, any>,
  ): void {
    this.kafka.emit('audit.events', {
      topic: 'audit.events',
      eventId: uuidv4(),
      timestamp: new Date().toISOString(),
      version: '1',
      service: 'admin-service',
      actorId: adminId,
      payload: {
        event: action,
        ...data,
      },
    });
  }
}
