import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AdminModule } from './admin.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AdminModule);

  app.use(cookieParser());

  await app.listen(4009);

  logger.log('admin-service listening on port 4009');
  logger.log('Admin operations require role=ADMIN JWT claim');
  logger.log('All admin actions are logged to audit.events');
}

bootstrap();
