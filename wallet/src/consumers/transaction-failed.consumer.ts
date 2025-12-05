import { consume } from "~/rabbitmq/consumer";
import { Queues } from "~/rabbitmq/topology";
import { TransactionFailedEvent } from "~/schemas/events/transaction-failed.event.schema";
import { logger } from "~/utils/logger";

export function transactionFailedConsumer() {
  consume<TransactionFailedEvent>(Queues.WALLET_REVERT, async (event) => {
    logger.info("Received FAILED event: ", event.transactionId);
  });
}
