import { Module } from '@nestjs/common';
import { KycController } from './kyc/kyc.controller';
import { KycService } from './kyc/kyc.service';
import { RedisService } from '@mint/common/services/redis.service';
import { PrismaService } from './prisma/prisma.service';
import { DocumentsController } from './documents/documents.controller';
import { DocumentsService } from './documents/documents.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { KycKafkaController } from './kyc/kyc-kafka.controller';
import { KycGrpcController } from './kyc/kyc-grpc.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'KAFKA_PRODUCER',
        transport: Transport.KAFKA,
        options: {
          client: {
            brokers: [process.env.KAFKA_BROKERS!],
          },
        },
      },
    ]),
  ],
  controllers: [
    DocumentsController,
    KycController,
    KycKafkaController,
    KycGrpcController,
  ],
  providers: [PrismaService, RedisService, DocumentsService, KycService],
})
export class KycModule {}
