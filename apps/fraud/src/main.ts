import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { FraudModule } from './fraud.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    FraudModule,
    {
      transport: Transport.GRPC,
      options: {
        url: '0.0.0.0:50052',
        protoPath: join(process.cwd(), 'libs/proto/fraud.proto'),
        package: 'fraud',
      },
    },
  );

  await app.listen();
  console.log('fraud-service gRPC listening on :50052');
}

bootstrap();
