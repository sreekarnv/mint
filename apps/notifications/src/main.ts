import './tracing';

import { NestFactory } from '@nestjs/core';
import { KafkaTraceInterceptor } from '@mint/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { NotificationsModule } from './notifications.module';
import cookieParser from 'cookie-parser';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(NotificationsModule);

  app.use(cookieParser());

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: { brokers: [process.env.KAFKA_BROKERS!] },
      consumer: { groupId: 'notifications-service' },
    },
  });

  app.useGlobalInterceptors(new KafkaTraceInterceptor());
  await app.startAllMicroservices();
  await app.listen(4006);

  logger.log('notifications-service listening on port 4006');
  logger.log('Kafka consumer ready for all event topics');
  logger.log('SSE endpoint available at /api/v1/notifications/stream');
}

bootstrap();
