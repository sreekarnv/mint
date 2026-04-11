import { z } from 'zod';

const id = z.string().min(1, 'Required');

export const addContactSchema = z.object({
  contactId: id,
});

export const moneyRequestSchema = z.object({
  recipientId: id,
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
        userId: id,
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
