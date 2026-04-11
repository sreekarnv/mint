import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc, ClientKafka } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

interface FraudQueueItem {
  caseId: string;
  transactionId: string;
  userId: string;
  score: number;
  rulesFired: string[];
  createdAt: string;
}

interface FraudServiceClient {
  listReviewQueue(data: {
    limit: number;
    offset: number;
  }): import('rxjs').Observable<{ items: FraudQueueItem[]; total: number }>;
}

@Injectable()
export class FraudService implements OnModuleInit {
  private readonly logger = new Logger(FraudService.name);
  private fraudClient: FraudServiceClient;

  constructor(
    @Inject('FRAUD_GRPC') private readonly fraudGrpc: ClientGrpc,
    @Inject('KAFKA_PRODUCER') private readonly kafka: ClientKafka,
  ) {}

  async onModuleInit() {
    this.fraudClient = this.fraudGrpc.getService<FraudServiceClient>('FraudService');
    await this.kafka.connect();
  }

  async listReviewQueue(adminId: string, limit: number, offset: number) {
    this.logger.log(`Admin ${adminId} listing fraud review queue`);
    return firstValueFrom(this.fraudClient.listReviewQueue({ limit, offset }));
  }

  async approveFraudCase(caseId: string, adminId: string, notes?: string) {
    this.logger.log(`Admin ${adminId} approving fraud case ${caseId}`);

    this.kafka.emit('admin.events', {
      topic: 'admin.events',
      eventId: uuidv4(),
      timestamp: new Date().toISOString(),
      version: '1',
      service: 'admin-service',
      actorId: adminId,
      payload: {
        event: 'admin.fraud_case_approved',
        caseId,
        reviewedBy: adminId,
        outcome: 'APPROVED',
        notes,
      },
    });

    this.emitAuditEvent('admin.fraud_case_reviewed', adminId, {
      caseId,
      reviewedBy: adminId,
      outcome: 'APPROVED',
      notes,
    });

    return { success: true, caseId, outcome: 'APPROVED' };
  }

  async blockFraudCase(caseId: string, adminId: string, notes?: string) {
    this.logger.warn(`Admin ${adminId} blocking fraud case ${caseId}`);

    this.kafka.emit('admin.events', {
      topic: 'admin.events',
      eventId: uuidv4(),
      timestamp: new Date().toISOString(),
      version: '1',
      service: 'admin-service',
      actorId: adminId,
      payload: {
        event: 'admin.fraud_case_blocked',
        caseId,
        reviewedBy: adminId,
        outcome: 'BLOCKED',
        notes,
      },
    });

    this.emitAuditEvent('admin.fraud_case_reviewed', adminId, {
      caseId,
      reviewedBy: adminId,
      outcome: 'BLOCKED',
      notes,
    });

    return { success: true, caseId, outcome: 'BLOCKED' };
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
