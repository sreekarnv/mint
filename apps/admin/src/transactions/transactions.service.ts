import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TransactionsService implements OnModuleInit {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(@Inject('KAFKA_PRODUCER') private readonly kafka: ClientKafka) {}

  async onModuleInit() {
    await this.kafka.connect();
  }

  async reverseTransaction(
    transactionId: string,
    adminId: string,
    reason: string,
  ) {
    this.logger.warn(
      `Admin ${adminId} reversing transaction ${transactionId}: ${reason}`,
    );

    this.kafka.emit('admin.events', {
      topic: 'admin.events',
      eventId: uuidv4(),
      timestamp: new Date().toISOString(),
      version: '1',
      service: 'admin-service',
      actorId: adminId,
      payload: {
        event: 'admin.transaction_reversed',
        transactionId,
        reversedBy: adminId,
        reason,
      },
    });

    this.emitAuditEvent('admin.transaction_reversed', adminId, {
      transactionId,
      reversedBy: adminId,
      reason,
    });

    return { success: true, transactionId };
  }

  async forceCompleteTransaction(transactionId: string, adminId: string) {
    this.logger.warn(
      `Admin ${adminId} force-completing transaction ${transactionId}`,
    );

    this.kafka.emit('admin.events', {
      topic: 'admin.events',
      eventId: uuidv4(),
      timestamp: new Date().toISOString(),
      version: '1',
      service: 'admin-service',
      actorId: adminId,
      payload: {
        event: 'admin.transaction_force_completed',
        transactionId,
        completedBy: adminId,
      },
    });

    this.emitAuditEvent('admin.transaction_force_completed', adminId, {
      transactionId,
      completedBy: adminId,
    });

    return { success: true, transactionId };
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
