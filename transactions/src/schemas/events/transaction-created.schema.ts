import { z } from "zod";
import { transactionType } from "~/schemas/domain/transaction.domain.schema";

export const transactionCreatedEventSchema = z.object({
  transactionId: z.string(),
  type: transactionType,
  amount: z.number(),
  userId: z.string().optional(),
  fromUserId: z.string().optional(),
  toUserId: z.string().optional(),
});

export type TransactionCreatedEvent = z.infer<typeof transactionCreatedEventSchema>;
