import { NestFactory } from '@nestjs/core';
import { TransactionsModule } from './transactions.module';
import { Logger } from '@nestjs/common';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(TransactionsModule);

  app.use(cookieParser());
  app.enableCors();

  await app.listen(4003);
  logger.log('transactions-service listening on port 4003');
}

bootstrap();
