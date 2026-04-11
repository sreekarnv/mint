import { z } from 'zod';

export const addContactSchema = z.object({
  contactId: z.string().uuid('Invalid contact ID'),
});

export const moneyRequestSchema = z.object({
  recipientId: z.string().uuid('Invalid recipient ID'),
  amount: z.number().int().positive('Amount must be positive'),
  currency: z.string().optional(),
  note: z.string().max(255).optional(),
});

export const createSplitSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  totalCents: z.number().int().positive('Total must be positive'),
  currency: z.string().optional(),
  participants: z
    .array(
      z.object({
        userId: z.string().uuid('Invalid user ID'),
        amountCents: z.number().int().positive('Amount must be positive'),
      }),
    )
    .min(1, 'At least one participant required'),
});

export const sendMoneySchema = z.object({
  amount: z.number().int().positive('Amount must be positive'),
  description: z.string().max(255).optional(),
});

export type AddContactInput = z.infer<typeof addContactSchema>;
export type MoneyRequestInput = z.infer<typeof moneyRequestSchema>;
export type CreateSplitInput = z.infer<typeof createSplitSchema>;
export type SendMoneyInput = z.infer<typeof sendMoneySchema>;
