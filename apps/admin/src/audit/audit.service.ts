import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  private get auditUrl(): string {
    return process.env.AUDIT_SERVICE_URL ?? 'http://audit:4010';
  }

  async queryLog(
    adminId: string,
    authHeader: string,
    params: {
      actorId?: string;
      action?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
      pageSize?: number;
    },
  ) {
    this.logger.log(`Admin ${adminId} querying audit log`);
    const qs = new URLSearchParams();
    if (params.actorId) qs.set('actorId', params.actorId);
    if (params.action) qs.set('action', params.action);
    if (params.startDate) qs.set('startDate', params.startDate);
    if (params.endDate) qs.set('endDate', params.endDate);
    if (params.page) qs.set('page', String(params.page));
    if (params.pageSize) qs.set('pageSize', String(params.pageSize));

    const res = await fetch(`${this.auditUrl}/internal/audit?${qs}`, {
      headers: { Authorization: authHeader },
    });
    if (!res.ok) throw new Error(`Audit query failed: ${res.status}`);
    return res.json();
  }
}
