import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { TransactionsModule } from './transactions.module';
import { Logger } from '@nestjs/common';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(TransactionsModule);

  app.use(cookieParser());
  app.enableCors();

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: { brokers: [process.env.KAFKA_BROKERS!] },
      consumer: { groupId: 'transactions-service' },
    },
  });

  await app.startAllMicroservices();
  await app.listen(4003);
  logger.log('transactions-service listening on port 4003');
  logger.log('Kafka consumer ready (social.events)');
}

bootstrap();
