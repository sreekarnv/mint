import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FraudService implements OnModuleInit {
  private readonly logger = new Logger(FraudService.name);

  constructor(@Inject('KAFKA_PRODUCER') private readonly kafka: ClientKafka) {}

  async onModuleInit() {
    await this.kafka.connect();
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
