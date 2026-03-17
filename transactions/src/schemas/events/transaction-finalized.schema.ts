import z from "zod";

export const transactionFinalizedEventSchema = z.object({
  transactionId: z.string(),
  status: z.enum(["Completed", "Failed"]),
  reason: z.string().optional(),
});

export type TransactionFinalizedEvent = z.infer<typeof transactionFinalizedEventSchema>;
