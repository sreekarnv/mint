import { Injectable } from '@nestjs/common';

@Injectable()
export class FraudService {
  getHello(): string {
    return 'Hello World!';
  }
}
