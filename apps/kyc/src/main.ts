import './tracing';

import { KafkaTraceInterceptor } from '@mint/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import cookieParser from 'cookie-parser';
import { join } from 'path';
import { KycModule } from './kyc.module';

import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(KycModule);

  const config = new DocumentBuilder()
    .setTitle('KYC Service')
    .setDescription(
      'Identity verification tiers, document upload, transaction limits',
    )
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
    { customSiteTitle: 'KYC Service - Swagger UI' },
  );
  app.use(cookieParser());

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      url: '0.0.0.0:50053',
      package: 'kyc',
      protoPath: join(process.cwd(), 'libs/proto/kyc.proto'),
    },
  });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: { brokers: [process.env.KAFKA_BROKERS!] },
      consumer: { groupId: 'kyc-service' },
    },
  });

  app.useGlobalInterceptors(new KafkaTraceInterceptor());
  await app.startAllMicroservices();

  await app.listen(4004);
}

bootstrap();
