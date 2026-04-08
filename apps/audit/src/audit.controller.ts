import { JWTAuthGuard } from '@mint/common';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuditService } from './audit.service';

@ApiTags('audit')
@ApiBearerAuth('access-token')
@Controller('internal/audit')
@UseGuards(JWTAuthGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'Query the immutable audit log' })
  @ApiQuery({
    name: 'actorId',
    required: false,
    description: 'Filter by actor user ID',
  })
  @ApiQuery({
    name: 'action',
    required: false,
    description: 'Filter by action type (e.g. transaction.created)',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'ISO 8601 start date filter',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'ISO 8601 end date filter',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (default 1)',
    type: 'integer',
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    description: 'Results per page (default 50)',
    type: 'integer',
  })
  @ApiResponse({ status: 200, description: 'Paginated audit log entries' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
