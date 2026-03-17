import { z } from "zod";

export const transferFormSchema = z.object({
  toUserId: z.string().min(1, "Please select a recipient"),
  amount: z
    .number({
      error: "Amount is required",
    })
    .positive("Amount must be greater than 0")
    .max(10000, "Amount cannot exceed $10,000")
    .multipleOf(0.01, "Amount must have at most 2 decimal places"),
});

export type TransferFormData = z.infer<typeof transferFormSchema>;
