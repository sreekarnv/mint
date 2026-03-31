import { z } from 'zod';

export const TopupDtoSchema = z.object({
  amount: z.number().int().positive('amount must be positive integer (cents)'),
  currency: z.string().length(3).default('USD'),
  description: z.string().max(500).optional(),
});

export type TopupDto = z.infer<typeof TopupDtoSchema>;
