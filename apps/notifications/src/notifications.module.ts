import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CommonModule } from '@mint/common';
import { PrismaService } from './prisma/prisma.service';
import { NotificationsService } from './notifications/notifications.service';
import { NotificationsController } from './notifications/notifications.controller';
import { SseService } from './sse/sse.service';
import { EmailWorker } from './email/email.worker';
import { AuthEventsController } from './kafka/auth-events.controller';
import { WalletEventsController } from './kafka/wallet-events.controller';
import { TransactionEventsController } from './kafka/transaction-events.controller';
import { KycEventsController } from './kafka/kyc-events.controller';
import { SocialEventsController } from './kafka/social-events.controller';
import { AnalyticsEventsController } from './kafka/analytics-events.controller';

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
    BullModule.forRoot({
      connection: parseRedisUrl(
        process.env.REDIS_URL || 'redis://localhost:6379',
      ),
    }),
    BullModule.registerQueue({ name: 'email' }),
  ],
  controllers: [
    NotificationsController,
    AuthEventsController,
    WalletEventsController,
    TransactionEventsController,
    KycEventsController,
    SocialEventsController,
    AnalyticsEventsController,
  ],
  providers: [
    PrismaService,
    NotificationsService,
    SseService,
    EmailWorker,
  ],
})
export class NotificationsModule {}
