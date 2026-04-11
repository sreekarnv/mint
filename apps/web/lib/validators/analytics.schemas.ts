import { z } from 'zod';

export const budgetSchema = z.object({
  category: z.enum([
    'FOOD',
    'TRANSPORT',
    'ENTERTAINMENT',
    'UTILITIES',
    'OTHER',
  ]),
  limitCents: z.number().int().positive('Limit must be positive'),
});

export type BudgetInput = z.infer<typeof budgetSchema>;
