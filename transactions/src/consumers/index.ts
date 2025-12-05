import { logger } from "~/utils/logger";
import { transactionsCreatedConsumer } from "~/consumers/transactions-created.consumer";
import { transactionFinalizedConsumer } from "~/consumers/transactions-finalized.consumer";

export async function startConsumers() {
  logger.info("Starting RabbitMQ Consumers");

  await transactionsCreatedConsumer();
  await transactionFinalizedConsumer();
}
