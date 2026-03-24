import { Controller, Get } from '@nestjs/common';
import { FraudService } from './fraud.service';

@Controller()
export class FraudController {
  constructor(private readonly fraudService: FraudService) {}

  @Get()
  getHello(): string {
    return this.fraudService.getHello();
  }
}
