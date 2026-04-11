'use client';

import { CurrencyInput } from '@/components/shared/currency-input';
import { Amount } from '@/components/shared/amount';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { type UserSearchResult } from '@/lib/api/auth';
import { createSplitSchema, type CreateSplitInput } from '@/lib/validators/social.schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, SplitSquareHorizontal, X } from 'lucide-react';
import { useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { UserSearchInput } from './user-search-input';

export function SplitForm({
  onSubmit,
  loading,
}: {
  onSubmit: (data: CreateSplitInput) => void;
  loading: boolean;
}) {
  const [participantUsers, setParticipantUsers] = useState<
    Record<string, UserSearchResult>
  >({});

  const form = useForm<CreateSplitInput>({
    resolver: zodResolver(createSplitSchema),
    defaultValues: { title: '', totalCents: 0, participants: [] },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'participants',
  });

  const totalCents = form.watch('totalCents');
  const participants = form.watch('participants');
  const allocatedCents = participants.reduce(
    (s, p) => s + (p.amountCents || 0),
    0,
  );
  const mismatch = totalCents > 0 && allocatedCents !== totalCents;

  function handleAddParticipant(user: UserSearchResult) {
    if (fields.find((f) => f.userId === user.id)) return;
    append({ userId: user.id, amountCents: 0 });
    setParticipantUsers((prev) => ({ ...prev, [user.id]: user }));
  }

  function handleRemoveParticipant(index: number, userId: string) {
    remove(index);
    setParticipantUsers((prev) => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Dinner, rent, trip…" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="totalCents"
          render={({ field }) => (
            <FormItem>
              <CurrencyInput
                label="Total Amount"
                value={field.value}
                onChange={field.onChange}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-3">
          <UserSearchInput
            label="Add Participants"
            onSelect={handleAddParticipant}
            placeholder="Search by email…"
          />
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="flex items-center gap-2 pl-2 border-l-2 border-primary/20"
            >
              <span className="text-sm flex-1 truncate text-muted-foreground">
                {participantUsers[field.userId]?.name ??
                  participantUsers[field.userId]?.email ??
                  field.userId}
              </span>
              <Controller
                control={form.control}
                name={`participants.${index}.amountCents`}
                render={({ field: f }) => (
                  <CurrencyInput label="" value={f.value} onChange={f.onChange} />
                )}
              />
              <button
                type="button"
                onClick={() => handleRemoveParticipant(index, field.userId)}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          {mismatch && (
            <p className="text-xs text-destructive">
              Allocated <Amount cents={allocatedCents} /> of{' '}
              <Amount cents={totalCents} /> total
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={loading || mismatch}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <SplitSquareHorizontal className="h-4 w-4 mr-2" />
          )}
          {loading ? 'Creating…' : 'Create Split'}
        </Button>
      </form>
    </Form>
  );
}
