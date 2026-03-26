import { Module } from '@nestjs/common';
import { KycController } from './kyc/kyc.controller';
import { KycService } from './kyc/kyc.service';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [],
  controllers: [KycController],
  providers: [PrismaService, KycService],
})
export class KycModule {}
