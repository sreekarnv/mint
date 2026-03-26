import { NestFactory } from '@nestjs/core';
import { KycModule } from './kyc.module';

async function bootstrap() {
  const app = await NestFactory.create(KycModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
