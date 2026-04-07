import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import cookieParser from 'cookie-parser';
import { AuditModule } from './audit.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AuditModule);
  app.use(cookieParser());

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'audit-service',
        brokers: [process.env.KAFKA_BROKERS!],
      },
      consumer: {
        groupId: 'audit-service',
      },
      subscribe: {
        topics: [
          'auth.events',
          'wallet.events',
          'transaction.events',
          'kyc.events',
          'social.events',
          'analytics.events',
          'webhook.events',
          'admin.events',
        ],
        fromBeginning: false,
      },
    },
  });

  await app.startAllMicroservices();
  await app.listen(4010);

  logger.log('audit-service HTTP listening on :4010');
  logger.log('audit-service Kafka subscribed to ALL topics');
  logger.log('Audit log is IMMUTABLE (enforced by trigger)');
}

bootstrap();
