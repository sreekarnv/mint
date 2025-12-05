import { transactionCompletedConsumer } from "~/consumers/transaction-completed.consumer";
import { transactionFailedConsumer } from "~/consumers/transaction-failed.consumer";
import { userSignupConsumer } from "~/consumers/user-signup.consumer";
import { logger } from "~/utils/logger";

export async function startConsumers() {
  logger.info("Starting RabbitMQ consumers");

  transactionCompletedConsumer();
  transactionFailedConsumer();
  await userSignupConsumer();
}
