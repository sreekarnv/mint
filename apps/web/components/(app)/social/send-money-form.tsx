'use client';

import { CurrencyInput } from '@/components/shared/currency-input';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { sendMoneySchema, type SendMoneyInput } from '@/lib/validators/social.schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Send } from 'lucide-react';
import { useForm } from 'react-hook-form';

export function SendMoneyForm({
  recipientId,
  onSubmit,
  loading,
}: {
  recipientId: string;
  onSubmit: (amount: number, description?: string) => void;
  loading: boolean;
}) {
  const form = useForm<SendMoneyInput>({
    resolver: zodResolver(sendMoneySchema),
    defaultValues: { amount: 0, description: '' },
  });

  function handleSubmit(values: SendMoneyInput) {
    onSubmit(values.amount, values.description || undefined);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <CurrencyInput
                label="Amount"
                value={field.value}
                onChange={field.onChange}
              />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Note (optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="What's this for?" rows={2} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full"
          disabled={loading || !recipientId}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          {loading ? 'Sending…' : 'Send Money'}
        </Button>
      </form>
    </Form>
  );
}
