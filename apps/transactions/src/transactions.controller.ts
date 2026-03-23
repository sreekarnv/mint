import { Controller, Get, Inject } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { ClientKafka } from '@nestjs/microservices';
import uuid from 'uuid';

@Controller('api/v1/transactions')
export class TransactionsController {
  constructor(
    private readonly transactionsService: TransactionsService,
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  @Get('/')
  getHello() {
    this.kafkaClient.emit('transactions.events', {
      topic: 'transactions.events',
      eventId: uuid.v4(),
      version: '1',
      actorId: 'transaction-id',
      payload: {
        message: 'This is a test transaction',
      },
    });
    return this.transactionsService.getMessage();
  }
}
