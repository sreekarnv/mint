import { Controller, Get } from '@nestjs/common';
import { KycService } from './kyc.service';

@Controller()
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Get()
  getHello(): string {
    return this.kycService.getHello();
  }
}
