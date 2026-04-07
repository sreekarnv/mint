import { CommonModule } from '@mint/common';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { DeliveryService } from './delivery/delivery.service';
import { DeliveryWorker } from './delivery/delivery.worker';
import { EndpointsController } from './endpoints/endpoints.controller';
import { EndpointsService } from './endpoints/endpoints.service';
import { AnalyticsEventsController } from './kafka/analytics-events.controller';
import { SocialEventsController } from './kafka/social-events.controller';
import { TransactionEventsController } from './kafka/transaction-events.controller';
import { WalletEventsController } from './kafka/wallet-events.controller';
import { PrismaService } from './prisma/prisma.service';
import { SigningService } from './signing/signing.service';

function parseRedisUrl(url: string): { host: string; port: number } {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port || '6379'),
  };
}

@Module({
  imports: [
    CommonModule,
    ClientsModule.register([
      {
        name: 'KAFKA_CONSUMER',
        transport: Transport.KAFKA,
        options: {
          client: {
            brokers: [process.env.KAFKA_BROKERS!],
          },
          consumer: {
            groupId: 'webhook-service',
          },
        },
      },
    ]),
    BullModule.forRoot({
      connection: parseRedisUrl(
        process.env.REDIS_URL || 'redis://localhost:6379',
      ),
    }),
    BullModule.registerQueue({ name: 'webhook-delivery' }),
  ],
  controllers: [
    EndpointsController,
    WalletEventsController,
    TransactionEventsController,
    SocialEventsController,
    AnalyticsEventsController,
  ],
  providers: [
    PrismaService,
    SigningService,
    EndpointsService,
    DeliveryService,
    DeliveryWorker,
  ],
})
export class WebhookModule {}
