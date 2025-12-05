import { logger } from "~/utils/logger";
import { getChannel } from "~/rabbitmq/bootstrap";

export async function consume<T>(queue: string, handler: (msg: T) => Promise<void>) {
  const ch = getChannel();

  await ch.consume(queue, async (msg) => {
    if (!msg) return;

    try {
      const data = JSON.parse(msg.content.toString());
      await handler(data);
      ch.ack(msg);
    } catch (err) {
      logger.error(`RabbitMQ Consumer error in queue ${queue}`, err);
      ch.nack(msg, false, true);
    }
  });

  logger.info(`Listening on queue: ${queue}`);
}
