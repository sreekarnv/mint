import { Injectable, Logger } from '@nestjs/common';
import { InputJsonValue } from './generated/prisma/internal/prismaNamespace';
import type {
  AuditLogCreateInput,
  AuditLogWhereInput,
  AuditLogWhereUniqueInput,
} from './generated/prisma/models';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prismaService: PrismaService) {}

  async appendEntry(envelope: any): Promise<void> {
    const entry: AuditLogCreateInput = {
      eventId: envelope.eventId,
      topic: envelope.topic,
      actorId: envelope.actorId,
      service: envelope.service || this.extractService(envelope.topic),
      action: this.extractAction(envelope),
      resourceType: this.deriveResourceType(envelope.topic),
      resourceId: this.deriveResourceId(envelope.payload),
      afterState: envelope.payload as InputJsonValue,
      traceId: envelope.traceId,
      createdAt: new Date(envelope.timestamp),
    };

    try {
      await this.prismaService.auditLog.create({ data: entry });
      this.logger.debug(`Audit: ${entry.action}`);
    } catch (error) {
      this.logger.error(`Audit insert failed: ${error.message}`);
    }
  }

  async queryLog(params: {
    actorId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    pageSize?: number;
  }) {
    const limit = params.pageSize || 50;
    const offset = ((params.page || 1) - 1) * limit;

    const [entries, total] = await Promise.all([
      this.__query({ ...params, limit, offset }),
      this.__count(params),
    ]);

    return {
      entries,
      total,
      page: params.page || 1,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private extractService(topic: string): string {
    return `${topic.split('.')[0]}-service`;
  }

  private extractAction(envelope: any): string {
    return envelope.payload?.event || envelope.topic;
  }

  private deriveResourceType(topic: string): string | null {
    const map: Record<string, string> = {
      'auth.events': 'user',
      'wallet.events': 'wallet',
      'transaction.events': 'transaction',
      'kyc.events': 'kyc_profile',
      'social.events': 'social',
      'analytics.events': 'budget',
      'webhook.events': 'webhook',
      'admin.events': 'admin_action',
    };
    return map[topic] || null;
  }

  private deriveResourceId(payload: any): string | null {
    return (
      payload?.transactionId ||
      payload?.userId ||
      payload?.walletId ||
      payload?.profileId ||
      payload?.requestId ||
      payload?.splitId ||
      null
    );
  }

  async __query(params: {
    actorId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    let where: AuditLogWhereUniqueInput | Record<string, any> = {};

    if (params.actorId) where.actorId = params.actorId;
    if (params.action) where.action = params.action;

    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) where.createdAt.gte = params.startDate;
      if (params.endDate) where.createdAt.lte = params.endDate;
    }

    const rows = await this.prismaService.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: params.limit || 100,
      skip: params.offset || 0,
    });
    return rows.map((r) => ({ ...r, id: r.id.toString() }));
  }

  async __count(params: {
    actorId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<number> {
    let where: AuditLogWhereInput | Record<string, any> = {};

    if (params.actorId) where.actorId = params.actorId;
    if (params.action) where.action = params.action;

    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) where.createdAt.gte = params.startDate;
      if (params.endDate) where.createdAt.lte = params.endDate;
    }

    return this.prismaService.auditLog.count({ where });
  }
}
