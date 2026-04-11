import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AdminJwtGuard } from '../guards/admin-jwt.guard';
import { FraudService } from './fraud.service';

@ApiTags('admin')
@ApiBearerAuth('access-token')
@Controller('admin/fraud')
@UseGuards(AdminJwtGuard)
export class FraudController {
  constructor(private readonly fraudService: FraudService) {}

  @Get('queue')
  @ApiOperation({ summary: 'List fraud cases in REVIEW state (admin)' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  @ApiResponse({ status: 200, description: 'Fraud review queue' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async listQueue(
    @Req() req: any,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.fraudService.listReviewQueue(
      req.user.sub,
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Post(':caseId/approve')
  @ApiOperation({ summary: 'Approve a fraud case (clear transaction) (admin)' })
  @ApiParam({ name: 'caseId', description: 'Fraud case ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        notes: { type: 'string', example: 'Verified legitimate transaction' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Case approved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Case not found' })
  async approve(
    @Req() req: any,
    @Param('caseId') caseId: string,
    @Body() body: { notes?: string },
  ) {
    return this.fraudService.approveFraudCase(caseId, req.user.sub, body.notes);
  }

  @Post(':caseId/block')
  @ApiOperation({ summary: 'Block a fraud case (reverse transaction) (admin)' })
  @ApiParam({ name: 'caseId', description: 'Fraud case ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        notes: { type: 'string', example: 'Confirmed fraudulent activity' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Case blocked and transaction reversed',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Case not found' })
  async block(
    @Req() req: any,
    @Param('caseId') caseId: string,
    @Body() body: { notes?: string },
  ) {
    return this.fraudService.blockFraudCase(caseId, req.user.sub, body.notes);
  }
}
