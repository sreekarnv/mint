import { Category } from '@/lib/api/transactions';

export const CATEGORIES: Category[] = [
  'FOOD',
  'TRANSPORT',
  'ENTERTAINMENT',
  'UTILITIES',
  'OTHER',
];

export const CATEGORY_META: Record<
  Category,
  { label: string; color: string; bg: string; text: string }
> = {
  FOOD: {
    label: 'Food',
    color: '#3B82F6',
    bg: 'bg-blue-50',
    text: 'text-blue-600',
  },
  TRANSPORT: {
    label: 'Transport',
    color: '#8B5CF6',
    bg: 'bg-violet-50',
    text: 'text-violet-600',
  },
  ENTERTAINMENT: {
    label: 'Entertainment',
    color: '#EC4899',
    bg: 'bg-pink-50',
    text: 'text-pink-600',
  },
  UTILITIES: {
    label: 'Utilities',
    color: '#F59E0B',
    bg: 'bg-amber-50',
    text: 'text-amber-600',
  },
  OTHER: {
    label: 'Other',
    color: '#6B7280',
    bg: 'bg-zinc-100',
    text: 'text-zinc-500',
  },
};

export const categoryLabel = (c: string) =>
  CATEGORY_META[c as Category]?.label ?? c.charAt(0) + c.slice(1).toLowerCase();

export const categoryColor = (c: string) =>
  CATEGORY_META[c as Category]?.color ?? '#6B7280';
