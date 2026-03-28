import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { FraudModule } from './fraud.module';

async function bootstrap() {
  const app = await NestFactory.create(FraudModule);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      url: '0.0.0.0:50052',
      protoPath: join(process.cwd(), 'libs/proto/fraud.proto'),
      package: 'fraud',
    },
  });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: { brokers: [process.env.KAFKA_BROKERS!] },
      consumer: { groupId: 'fraud-service' },
    },
  });

  await app.startAllMicroservices();

  console.log('fraud-service gRPC listening on :50052, kafka consumer ready');
}

bootstrap();
