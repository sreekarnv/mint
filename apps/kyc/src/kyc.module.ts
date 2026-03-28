import { Module } from '@nestjs/common';
import { KycController } from './kyc/kyc.controller';
import { KycService } from './kyc/kyc.service';
import { PrismaService } from './prisma/prisma.service';
import { DocumentsController } from './documents/documents.controller';
import { DocumentsService } from './documents/documents.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { KycKafkaController } from './kyc/kyc-kafka.controller';
import { KycGrpcController } from './kyc/kyc-grpc.controller';
import { CommonModule } from '@mint/common';

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
    CommonModule,
  ],
  controllers: [
    DocumentsController,
    KycController,
    KycKafkaController,
    KycGrpcController,
  ],
  providers: [PrismaService, DocumentsService, KycService],
})
export class KycModule {}
