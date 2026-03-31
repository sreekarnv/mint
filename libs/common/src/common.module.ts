import { Module, Global } from '@nestjs/common';
import { RedisService } from './services/redis.service';
import { JWTAuthGuard } from './guards/jwt-auth.guard';
import { IdempotencyInterceptor } from './interceptors/idempotency.interceptor';

@Global()
@Module({
  providers: [RedisService, JWTAuthGuard, IdempotencyInterceptor],
  exports: [RedisService, JWTAuthGuard, IdempotencyInterceptor],
})
export class CommonModule {}
