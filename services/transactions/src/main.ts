import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';

async function bootstrap() {
  const app =
    await NestFactory.createMicroservice<MicroserviceOptions>(AppModule);

  await app.listen();
}

bootstrap();
