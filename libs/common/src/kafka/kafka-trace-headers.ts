import { context, propagation } from '@opentelemetry/api';

/**
 * Returns W3C trace context headers (traceparent, tracestate) for injection
 * into a Kafka message. Pass the result as the `headers` field of a KafkaRecord.
 *
 * Usage in emitEvent:
 *   this.kafka.emit(topic, { headers: getTraceHeaders(), value: payload });
 */
export function getTraceHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  propagation.inject(context.active(), headers);
  return headers;
}
