import './tracing';

import { KafkaTraceInterceptor } from '@mint/common';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import cookieParser from 'cookie-parser';
import { WebhookModule } from './webhook.module';

import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(WebhookModule);

  const config = new DocumentBuilder()
    .setTitle('Webhook Service')
    .setDescription('Outbound webhook endpoint registry and delivery logs')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .build();
  SwaggerModule.setup(
    'api-docs',
    app,
    SwaggerModule.createDocument(app, config),
    { customSiteTitle: 'Webhook Service - Swagger UI' },
  );
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
