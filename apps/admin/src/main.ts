import './tracing';

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AdminModule } from './admin.module';

import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AdminModule);

  const config = new DocumentBuilder()
    .setTitle('Admin Service')
    .setDescription('Privileged operational API — requires ADMIN role')
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
    { customSiteTitle: 'Admin Service - Swagger UI' },
  );

  app.use(cookieParser());

  await app.listen(4009);

  logger.log('admin-service listening on port 4009');
  logger.log('Admin operations require role=ADMIN JWT claim');
  logger.log('All admin actions are logged to audit.events');
}

bootstrap();
