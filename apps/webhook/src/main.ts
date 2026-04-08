import './tracing';

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { KafkaTraceInterceptor } from '@mint/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import cookieParser from 'cookie-parser';
import { WebhookModule } from './webhook.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(WebhookModule);
  app.use(cookieParser());

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: [process.env.KAFKA_BROKERS!],
      },
      consumer: {
        groupId: 'webhook-service',
      },
    },
  });

  app.useGlobalInterceptors(new KafkaTraceInterceptor());
  await app.startAllMicroservices();
  await app.listen(4008);

  logger.log('webhook-service listening on port 4008');
  logger.log('Kafka consumer ready for event delivery');
  logger.log('BullMQ processor ready for webhook delivery');
}

bootstrap();
