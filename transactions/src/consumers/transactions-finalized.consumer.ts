import { consume } from "~/rabbitmq/consumer";
import { Queues } from "~/rabbitmq/topology";
import { applyFinalStatus } from "~/services/transaction.service";
import { logger } from "~/utils/logger";
import { transactionFinalizedEventSchema } from "~/schemas/events/transaction-finalized.schema";

export async function transactionFinalizedConsumer() {
  await consume(Queues.TRANSACTION_FINALIZED, async (event) => {
    logger.info(`Consumed ${Queues.TRANSACTION_FINALIZED} called`);
    const parsed = transactionFinalizedEventSchema.parse(event);
    await applyFinalStatus(parsed);
  });
}
