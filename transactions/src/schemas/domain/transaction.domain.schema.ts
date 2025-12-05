import { z } from "zod";
import { objectId } from "~/schemas/common/objectid.schema";

export const transactionType = z.enum(["TopUp", "Transfer"]);
export const transactionStatus = z.enum(["Pending", "Processing", "Completed", "Failed"]);

export type TransactionType = z.infer<typeof transactionType>;
export type TransactionStatus = z.infer<typeof transactionStatus>;

export const createTransferSchema = z
  .object({
    amount: z.number().int().positive(),
    fromUserId: objectId,
    toUserId: objectId,
  })
  .refine((data) => data.fromUserId.toString() !== data.toUserId.toString(), {
    message: "fromUserId and toUserId cannot be the same",
    path: ["toUserId"],
  });

export type CreateTransferType = z.infer<typeof createTransferSchema>;

export const createTopUpSchema = z.object({
  amount: z.number().int().positive(),
  userId: objectId,
});

export type CreateTopUpType = z.infer<typeof createTopUpSchema>;
