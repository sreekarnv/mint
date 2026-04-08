import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { KafkaContext } from '@nestjs/microservices';
import { context, propagation } from '@opentelemetry/api';
import { Observable } from 'rxjs';

/**
 * Apply this interceptor globally (or per-controller) on services that consume
 * Kafka messages. It extracts the W3C trace context from the incoming message
 * headers so that child spans created inside the handler are correctly parented
 * to the producer's span, giving you one unbroken trace across async boundaries.
 */
@Injectable()
export class KafkaTraceInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    if (ctx.getType() !== 'rpc') {
      return next.handle();
    }

    const kafkaCtx = ctx.switchToRpc().getContext<KafkaContext>();
    const rawHeaders = kafkaCtx.getMessage()?.headers ?? {};

    const carrier: Record<string, string> = {};
    for (const [k, v] of Object.entries(rawHeaders)) {
      if (v == null) continue;
      carrier[k] = Buffer.isBuffer(v) ? v.toString() : String(v);
    }

    const extractedCtx = propagation.extract(context.active(), carrier);

    return new Observable((subscriber) => {
      context.with(extractedCtx, () => {
        next.handle().subscribe(subscriber);
      });
    });
  }
}
