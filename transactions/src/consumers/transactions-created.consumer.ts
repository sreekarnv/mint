import { consume } from "~/rabbitmq/consumer";
import { Queues } from "~/rabbitmq/topology";
import { transactionCreatedEventSchema } from "~/schemas/events/transaction-created.schema";
import { processTransaction } from "~/services/transaction.service";
import { logger } from "~/utils/logger";

export async function transactionsCreatedConsumer() {
  consume(Queues.TRANSACTION_CREATED, async (event) => {
    logger.info(`Consumed ${Queues.TRANSACTION_CREATED} called`);
    const parsed = transactionCreatedEventSchema.parse(event);
    await processTransaction(parsed);
  });
}
