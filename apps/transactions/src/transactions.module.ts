import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { CommonModule } from '@mint/common';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { PrismaService } from './prisma/prisma.service';
import { LimitService } from './limit/limit.service';
import { StateMachineService } from './state-machine/state-machine.service';

@Module({
  imports: [
    CommonModule,
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
      {
        name: 'FRAUD_CLIENT',
        transport: Transport.GRPC,
        options: {
          url: process.env.FRAUD_SERVICE_URL!,
          package: 'fraud',
          protoPath: join(process.cwd(), 'libs/proto/fraud.proto'),
        },
      },
      {
        name: 'KYC_CLIENT',
        transport: Transport.GRPC,
        options: {
          url: process.env.KYC_SERVICE_URL!,
          package: 'kyc',
          protoPath: join(process.cwd(), 'libs/proto/kyc.proto'),
        },
      },
    ]),
  ],
  controllers: [TransactionsController],
  providers: [
    PrismaService,
    TransactionsService,
    LimitService,
    StateMachineService,
  ],
})
export class TransactionsModule {}
