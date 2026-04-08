import './tracing';

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { SocialModule } from './social.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(SocialModule);

  app.use(cookieParser());

  await app.listen(4007);

  logger.log('social-service listening on port 4007');
  logger.log('BullMQ processor ready for money request expiry');
}

bootstrap();
