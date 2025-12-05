import { z } from "zod";
import { transactionType } from "../domain/transaction.domain.schema";

export const transactionFailedEventSchema = z.object({
  transactionId: z.string(),
  type: transactionType,
  reason: z.string().optional(),
});

export type TransactionFailedEvent = z.infer<typeof transactionFailedEventSchema>;
