import { Module } from '@nestjs/common';
import { KycController } from './kyc/kyc.controller';
import { KycService } from './kyc/kyc.service';
import { RedisService } from '@mint/common/services/redis.service';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [],
  controllers: [KycController],
  providers: [PrismaService, RedisService, KycService],
})
export class KycModule {}
