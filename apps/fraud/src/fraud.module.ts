import { Module } from '@nestjs/common';
import { FraudController } from './fraud.controller';
import { FraudService } from './fraud.service';
import { PrismaService } from './prisma/prisma.service';
import { RedisService } from '@mint/common/services/redis.service';

@Module({
  imports: [],
  controllers: [FraudController],
  providers: [PrismaService, RedisService, FraudService],
})
export class FraudModule {}
