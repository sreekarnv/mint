import { z } from "zod";

export const topupFormSchema = z.object({
  amount: z
    .number({
      error: "Amount is required",
    })
    .positive("Amount must be greater than 0")
    .max(10000, "Amount cannot exceed $10,000")
    .multipleOf(0.01, "Amount must have at most 2 decimal places"),
});

export type TopupFormData = z.infer<typeof topupFormSchema>;
