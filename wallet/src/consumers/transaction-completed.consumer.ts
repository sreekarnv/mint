import { consume } from "~/rabbitmq/consumer";
import { Queues } from "~/rabbitmq/topology";
import { TransactionCompletedEvent } from "~/schemas/events/transaction-completed.event.schema";
import { finalizeTransactionInWallet } from "~/services/wallet.service";
import { logger } from "~/utils/logger";

export function transactionCompletedConsumer() {
  consume<TransactionCompletedEvent>(Queues.WALLET_UPDATE, async (event) => {
    logger.info(`Received Completed event: `, event.transactionId);
    await finalizeTransactionInWallet(event);
  });
}
