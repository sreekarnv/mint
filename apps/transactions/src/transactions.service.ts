import { Injectable } from '@nestjs/common';

@Injectable()
export class TransactionsService {
  getMessage(): string {
    return 'Transactions Service';
  }
}
