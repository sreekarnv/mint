import { IdempotencyInterceptor, JWTAuthGuard } from '@mint/common';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { TopupDto, TopupDtoSchema } from './dto/topup.dto';
import { TransferDto, TransferDtoSchema } from './dto/transfer.dto';
import { TransactionsService } from './transactions.service';

@ApiTags('transactions')
@ApiBearerAuth('access-token')
@Controller('api/v1/transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('transfer')
  @UseGuards(JWTAuthGuard)
  @UseInterceptors(IdempotencyInterceptor)
  @ApiOperation({ summary: 'Transfer funds to another user' })
  @ApiHeader({
    name: 'Idempotency-Key',
    description:
      'UUID v4. Identical requests with the same key return the cached response.',
    required: true,
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['recipientId', 'amount'],
      properties: {
        recipientId: { type: 'string', example: 'clx1abc23def456' },
        amount: {
          type: 'integer',
          example: 5000,
          description: 'Amount in cents',
        },
        senderCurrency: { type: 'string', example: 'USD', default: 'USD' },
        recipientCurrency: { type: 'string', example: 'USD' },
        description: { type: 'string', example: 'Dinner split' },
        merchant: { type: 'string', example: 'Chipotle' },
        category: {
          type: 'string',
          enum: ['FOOD', 'TRANSPORT', 'ENTERTAINMENT', 'UTILITIES', 'OTHER'],
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Transfer completed' })
  @ApiResponse({
    status: 400,
    description: 'Validation failed or missing Idempotency-Key',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Duplicate idempotency key' })
  async transfer(
    @Body() body: unknown,
    @Req() req: Request,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    const result = TransferDtoSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: result.error.issues,
      });
    }

    const dto: TransferDto = result.data;
    const user = (req as any).user;
    const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';

    if (!idempotencyKey) {
      throw new BadRequestException('Idempotency-Key header required');
    }

    return this.transactionsService.transfer(
      dto,
      user.sub,
      idempotencyKey,
      ipAddress,
    );
  }

  @Post('topup')
  @UseGuards(JWTAuthGuard)
  @UseInterceptors(IdempotencyInterceptor)
  @ApiOperation({ summary: 'Top up wallet from external payment provider' })
  @ApiHeader({
    name: 'Idempotency-Key',
    description:
      'UUID v4. Identical requests with the same key return the cached response.',
    required: true,
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['amount'],
      properties: {
        amount: {
          type: 'integer',
          example: 10000,
          description: 'Amount in cents',
        },
        currency: { type: 'string', example: 'USD', default: 'USD' },
        description: { type: 'string', example: 'Top up via Stripe' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Top-up completed' })
  @ApiResponse({
    status: 400,
    description: 'Validation failed or missing Idempotency-Key',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async topup(
    @Body() body: unknown,
    @Req() req: Request,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    const result = TopupDtoSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: result.error.issues,
      });
    }

    const dto: TopupDto = result.data;
    const user = (req as any).user;

    if (!idempotencyKey) {
      throw new BadRequestException('Idempotency-Key header required');
    }

    return this.transactionsService.topup(dto, user.sub, idempotencyKey);
  }

  @Get()
  @UseGuards(JWTAuthGuard)
  @ApiOperation({
    summary: 'List transactions for the authenticated user (cursor-paginated)',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({
    name: 'cursor',
    required: false,
    type: String,
    description: 'Cursor from previous page',
  })
  @ApiResponse({ status: 200, description: 'Paginated transaction list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async list(
    @Req() req: Request,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    const user = (req as any).user;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.transactionsService.listTransactions(
      user.sub,
      limitNum,
      cursor,
    );
  }

  @Get('admin/list')
  @UseGuards(JWTAuthGuard)
  @ApiOperation({ summary: 'List all transactions (admin — requires internal call)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  @ApiQuery({ name: 'userId', required: false, type: String, description: 'Filter by user' })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Transaction list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async adminList(
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
    @Query('userId') userId?: string,
    @Query('status') status?: string,
  ) {
    return this.transactionsService.adminListTransactions({
      limit: limit ? parseInt(limit, 10) : 50,
      cursor,
      userId,
      status,
    });
  }

  @Get(':id')
  @UseGuards(JWTAuthGuard)
  @ApiOperation({ summary: 'Get a single transaction by ID' })
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  @ApiResponse({ status: 200, description: 'Transaction found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async getOne(@Param('id') id: string, @Req() req: Request) {
    const user = (req as any).user;
    return this.transactionsService.getTransaction(id, user.sub);
  }
}
