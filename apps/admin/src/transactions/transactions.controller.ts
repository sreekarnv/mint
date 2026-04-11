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
import { TransactionsService } from './transactions.service';

@ApiTags('admin')
@ApiBearerAuth('access-token')
@Controller('admin/transactions')
@UseGuards(AdminJwtGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  @ApiOperation({ summary: 'List all transactions (admin)' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiResponse({ status: 200, description: 'Transaction list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async list(
    @Req() req: any,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
    @Query('userId') userId?: string,
    @Query('status') status?: string,
  ) {
    return this.transactionsService.listTransactions(
      req.user.sub,
      req.headers.authorization,
      { limit: limit ? parseInt(limit, 10) : 50, cursor, userId, status },
    );
  }

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
