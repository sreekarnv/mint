import { NestFactory } from '@nestjs/core';
import { KycModule } from './kyc.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(KycModule);
  app.use(cookieParser());

  await app.listen(4004);
}

bootstrap();
