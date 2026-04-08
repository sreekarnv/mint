import './tracing';

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { SocialModule } from './social.module';

import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(SocialModule);

  const config = new DocumentBuilder()
    .setTitle('Social Service')
    .setDescription('Contacts, money requests, and bill splitting')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .build();
  SwaggerModule.setup(
    'api-docs',
    app,
    SwaggerModule.createDocument(app, config),
    { customSiteTitle: 'Social Service - Swagger UI' },
  );

  app.use(cookieParser());

  await app.listen(4007);

  logger.log('social-service listening on port 4007');
  logger.log('BullMQ processor ready for money request expiry');
}

bootstrap();
