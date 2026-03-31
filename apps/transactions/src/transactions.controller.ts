import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import type { Request } from 'express';
import { JWTAuthGuard, IdempotencyInterceptor } from '@mint/common';
import { TransactionsService } from './transactions.service';
import { TransferDtoSchema, TransferDto } from './dto/transfer.dto';
import { TopupDtoSchema, TopupDto } from './dto/topup.dto';

@Controller('api/v1/transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('transfer')
  @UseGuards(JWTAuthGuard)
  @UseInterceptors(IdempotencyInterceptor)
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

  @Get(':id')
  @UseGuards(JWTAuthGuard)
  async getOne(@Param('id') id: string, @Req() req: Request) {
    const user = (req as any).user;
    return this.transactionsService.getTransaction(id, user.sub);
  }
}
