import { Injectable } from '@nestjs/common';

@Injectable()
export class KycService {
  getHello(): string {
    return 'Hello World!';
  }
}
