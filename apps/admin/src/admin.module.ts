import { CommonModule } from '@mint/common';
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { FraudController } from './fraud/fraud.controller';
import { FraudService } from './fraud/fraud.service';
import { KycController } from './kyc/kyc.controller';
import { KycService } from './kyc/kyc.service';
import { SystemController } from './system/system.controller';
import { SystemService } from './system/system.service';
import { TransactionsController } from './transactions/transactions.controller';
import { TransactionsService } from './transactions/transactions.service';
import { UsersController } from './users/users.controller';
import { UsersService } from './users/users.service';

@Module({
  imports: [
    CommonModule,
    ClientsModule.register([
      {
        name: 'WALLET_GRPC',
        transport: Transport.GRPC,
        options: {
          url: process.env.WALLET_GRPC_URL || 'wallet:50051',
          package: 'wallet',
          protoPath: join(process.cwd(), 'libs/proto/wallet.proto'),
        },
      },
      {
        name: 'KYC_GRPC',
        transport: Transport.GRPC,
        options: {
          url: process.env.KYC_GRPC_URL || 'kyc:50053',
          package: 'kyc',
          protoPath: join(process.cwd(), 'libs/proto/kyc.proto'),
        },
      },
      {
        name: 'KAFKA_PRODUCER',
        transport: Transport.KAFKA,
        options: {
          client: { brokers: [process.env.KAFKA_BROKERS!] },
        },
      },
    ]),
  ],
  controllers: [
    UsersController,
    TransactionsController,
    FraudController,
    KycController,
    SystemController,
  ],
  providers: [
    UsersService,
    TransactionsService,
    FraudService,
    KycService,
    SystemService,
  ],
})
export class AdminModule {}
