import { type Request } from 'express';
import { Controller, Get, Inject, Req, UseGuards } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { ClientKafka } from '@nestjs/microservices';
import uuid from 'uuid';
import { JWTAuthGuard } from '@mint/common/guards/jwt-auth.guard';

@Controller('api/v1/transactions')
export class TransactionsController {
  constructor(
    private readonly transactionsService: TransactionsService,
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  @Get('/')
  @UseGuards(JWTAuthGuard)
  getHello(@Req() req: Request) {
    const user = (req as any).user;

    this.kafkaClient.emit('transactions.events', {
      topic: 'transactions.events',
      eventId: uuid.v4(),
      version: '1',
      actorId: 'transaction-id',
      payload: {
        message: 'This is a test transaction',
        user,
      },
    });
    return this.transactionsService.getMessage();
  }
}
