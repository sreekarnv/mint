import './tracing';

import { KafkaTraceInterceptor } from '@mint/common';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import cookieParser from 'cookie-parser';
import { AuditModule } from './audit.module';

import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AuditModule);

  const config = new DocumentBuilder()
    .setTitle('Audit Service')
    .setDescription('Append-only compliance audit log')
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
    { customSiteTitle: 'Audit Service - Swagger UI' },
  );
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
    },
  });

  app.useGlobalInterceptors(new KafkaTraceInterceptor());
  await app.startAllMicroservices();
  await app.listen(4010);

  logger.log('audit-service HTTP listening on :4010');
  logger.log('audit-service Kafka subscribed to ALL topics');
  logger.log('Audit log is IMMUTABLE (enforced by trigger)');
}

bootstrap();
