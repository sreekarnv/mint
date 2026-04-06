import { CommonModule } from '@mint/common';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ContactsController } from './contacts/contacts.controller';
import { ContactsService } from './contacts/contacts.service';
import { PrismaService } from './prisma/prisma.service';
import { RequestsController } from './requests/requests.controller';
import { RequestsProcessor } from './requests/requests.processor';
import { RequestsService } from './requests/requests.service';
import { SplitsController } from './splits/splits.controller';
import { SplitsService } from './splits/splits.service';

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
        name: 'KAFKA_PRODUCER',
        transport: Transport.KAFKA,
        options: {
          client: { brokers: [process.env.KAFKA_BROKERS!] },
        },
      },
    ]),
    BullModule.forRoot({
      connection: parseRedisUrl(
        process.env.REDIS_URL || 'redis://localhost:6379',
      ),
    }),
    BullModule.registerQueue({ name: 'social-jobs' }),
  ],
  controllers: [ContactsController, RequestsController, SplitsController],
  providers: [
    PrismaService,
    ContactsService,
    RequestsService,
    RequestsProcessor,
    SplitsService,
  ],
})
export class SocialModule {}
