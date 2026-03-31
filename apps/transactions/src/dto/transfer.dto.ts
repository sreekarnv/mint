import { z } from 'zod';

export const TransferDtoSchema = z.object({
  recipientId: z.string().uuid('recipientId must be valid UUID'),
  amount: z.number().int().positive('amount must be positive integer (cents)'),
  senderCurrency: z
    .string()
    .length(3, 'currency must be 3-letter code')
    .default('USD'),
  recipientCurrency: z.string().length(3).optional(),
  description: z.string().max(500).optional(),
  category: z
    .enum([
      'FOOD',
      'TRANSPORT',
      'ENTERTAINMENT',
      'TRANSFER',
      'UTILITIES',
      'OTHER',
    ])
    .optional(),
});

export type TransferDto = z.infer<typeof TransferDtoSchema>;
