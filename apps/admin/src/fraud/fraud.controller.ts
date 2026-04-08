import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
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
