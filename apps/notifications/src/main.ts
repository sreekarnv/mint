import './tracing';

import { KafkaTraceInterceptor } from '@mint/common';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import cookieParser from 'cookie-parser';
import { NotificationsModule } from './notifications.module';

import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(NotificationsModule);

  const config = new DocumentBuilder()
    .setTitle('Notifications Service')
    .setDescription('In-app notifications and real-time SSE stream')
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
    { customSiteTitle: 'Notifications Service - Swagger UI' },
  );

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
