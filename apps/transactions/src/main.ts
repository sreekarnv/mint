import { NestFactory } from '@nestjs/core';
import { TransactionsModule } from './transactions.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(TransactionsModule);
  app.use(cookieParser());
  await app.listen(4003);
}

bootstrap();
