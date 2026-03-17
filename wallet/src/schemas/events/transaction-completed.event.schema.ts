import { z } from "zod";
import { transactionType } from "../domain/transaction.domain.schema";

export const transactionCompletedEventSchema = z.object({
  transactionId: z.string(),
  type: transactionType,
  amount: z.number(),

  userId: z.string().optional(),
  fromUserId: z.string().optional(),
  toUserId: z.string().optional(),
});

export type TransactionCompletedEvent = z.infer<typeof transactionCompletedEventSchema>;
