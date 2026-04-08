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
import { TransactionsService } from './transactions.service';

@ApiTags('admin')
@ApiBearerAuth('access-token')
@Controller('admin/transactions')
@UseGuards(AdminJwtGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post(':id/reverse')
  @ApiOperation({ summary: 'Reverse a transaction (admin)' })
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['reason'],
      properties: {
        reason: { type: 'string', example: 'Customer dispute resolved' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Transaction reversed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async reverse(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { reason: string },
  ) {
    return this.transactionsService.reverseTransaction(
      id,
      req.user.sub,
      body.reason,
    );
  }

  @Post(':id/force-complete')
  @ApiOperation({ summary: 'Force-complete a stuck transaction (admin)' })
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  @ApiResponse({ status: 201, description: 'Transaction force-completed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async forceComplete(@Req() req: any, @Param('id') id: string) {
    return this.transactionsService.forceCompleteTransaction(id, req.user.sub);
  }
}
