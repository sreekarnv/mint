import { JWTAuthGuard } from '@mint/common';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';

@Controller('internal/audit')
@UseGuards(JWTAuthGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  async query(
    @Query('actorId') actorId?: string,
    @Query('action') action?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.auditService.queryLog({
      actorId,
      action,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 50,
    });
  }
}
