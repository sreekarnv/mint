import { getChannel } from "~/rabbitmq/bootstrap";

export function publish<T>(exchange: string, routingKey: string, payload: T) {
  const ch = getChannel();
  ch.publish(exchange, routingKey, Buffer.from(JSON.stringify(payload)), { persistent: true });
}
