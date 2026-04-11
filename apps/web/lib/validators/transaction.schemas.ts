import { z } from 'zod';

export const topupSchema = z.object({
  amount: z.number().int().positive('Amount must be positive'),
  currency: z.string().optional(),
  description: z.string().max(255).optional(),
});

export const transferSchema = z.object({
  recipientId: z.string().min(1, 'Recipient is required'),
  amount: z.number().int().positive('Amount must be positive'),
  senderCurrency: z.string().optional(),
  recipientCurrency: z.string().optional(),
  description: z.string().max(255).optional(),
  merchant: z.string().max(255).optional(),
  category: z
    .enum(['FOOD', 'TRANSPORT', 'ENTERTAINMENT', 'UTILITIES', 'OTHER'])
    .optional(),
});

export type TopupInput = z.infer<typeof topupSchema>;
export type TransferInput = z.infer<typeof transferSchema>;
