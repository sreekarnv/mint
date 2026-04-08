import './tracing';

import { NestFactory } from '@nestjs/core';
import { KafkaTraceInterceptor } from '@mint/common';
import { KycModule } from './kyc.module';
import cookieParser from 'cookie-parser';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(KycModule);
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
