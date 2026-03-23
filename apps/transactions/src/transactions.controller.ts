import { Controller, Get } from '@nestjs/common';
import { TransactionsService } from './transactions.service';

@Controller('api/v1/transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  getHello() {
    return this.transactionsService.getMessage();
  }
}
