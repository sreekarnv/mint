import amqp, { Channel, Connection } from "amqplib";
import { startConsumers } from "~/consumers";
import { env } from "~/env";
import { Exchanges, Queues, Bindings } from "~/rabbitmq/topology";
import { logger } from "~/utils/logger";

let connection: Connection;
let channel: Channel;

async function bootstrapMQ() {
  const c = await amqp.connect(env.RABBITMQ_URL);
  connection = c.connection;
  connection.on("error", (err) => logger.error("RabbitMQ connection error", err));
  connection.on("close", () => {
    logger.error("RabbitMQ connection closed. Reconnecting...");
    setTimeout(bootstrapMQ, 2000);
  });

  channel = await c.createChannel();

  await declareExchanges();
  await declareQueues();
  await bindQueues();

  logger.info("RabbitMQ initialized & topology bootstrapped");

  await startConsumers();
}

function getChannel() {
  if (!channel) throw new Error("RabbitMQ not initialized");
  return channel;
}

async function declareExchanges() {
  const ch = getChannel();

  for (const ex of Object.values(Exchanges)) {
    await ch.assertExchange(ex, "direct", { durable: true });
  }
}

async function declareQueues() {
  const ch = getChannel();

  for (const q of Object.values(Queues)) {
    await ch.assertQueue(q, { durable: true });
  }
}

async function bindQueues() {
  const ch = getChannel();

  for (const b of Bindings) {
    await ch.bindQueue(b.queue, b.exchange, b.key);
  }
}

export { getChannel, bootstrapMQ };
