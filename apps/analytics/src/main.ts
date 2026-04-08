import './tracing';

import { KafkaTraceInterceptor } from '@mint/common';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import cookieParser from 'cookie-parser';
import { AnalyticsModule } from './analytics.module';

import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AnalyticsModule);

  const config = new DocumentBuilder()
    .setTitle('Analytics Service')
    .setDescription('Spend categorisation, monthly insights, budget management')
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
    { customSiteTitle: 'Analytics Service - Swagger UI' },
  );

  app.use(cookieParser());

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: { brokers: [process.env.KAFKA_BROKERS!] },
      consumer: { groupId: 'analytics-service' },
    },
  });

  app.useGlobalInterceptors(new KafkaTraceInterceptor());
  await app.startAllMicroservices();
  await app.listen(4005);

  logger.log('analytics-service listening on port 4005');
  logger.log('Kafka consumer ready for transaction.events');
}

bootstrap();
