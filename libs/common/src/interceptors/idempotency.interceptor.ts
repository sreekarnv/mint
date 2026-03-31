import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RedisService } from '../services/redis.service';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(private readonly redis: RedisService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const idempotencyKey = request.headers['idempotency-key'];

    if (!idempotencyKey) {
      throw new BadRequestException(
        'Idempotency-Key header is required for this endpoint',
      );
    }

    const userId = request.user?.sub;
    if (!userId) {
      throw new BadRequestException(
        'User authentication required for idempotent operations',
      );
    }

    const redisKey = `idempotency:${userId}:${idempotencyKey}`;
    const cachedResponse = await this.redis.get(redisKey);

    if (cachedResponse) {
      try {
        const parsed = JSON.parse(cachedResponse);
        return of(parsed);
      } catch (err) {
        await this.redis.del(redisKey);
      }
    }

    return next.handle().pipe(
      tap(async (response) => {
        await this.redis.set(redisKey, JSON.stringify(response), 86400);
      }),
    );
  }
}
