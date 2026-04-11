'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const schema = z.object({ reason: z.string().min(1, 'Reason is required') });
type FormValues = z.infer<typeof schema>;

export function ReverseDialog({
  onReverse,
  loading,
}: {
  onReverse: (reason: string) => void;
  loading: boolean;
}) {
  const [open, setOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { reason: '' },
  });

  function handleSubmit(values: FormValues) {
    onReverse(values.reason);
    setOpen(false);
    form.reset();
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) form.reset();
  }

  return (
    <>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        <RotateCcw className="h-4 w-4 mr-2" />
        Reverse
      </Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reverse Transaction</DialogTitle>
            <DialogDescription>
              Funds will be returned to the sender. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Reason for reversal"
                        autoFocus
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="destructive" disabled={loading}>
                  {loading ? 'Reversing…' : 'Reverse'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
