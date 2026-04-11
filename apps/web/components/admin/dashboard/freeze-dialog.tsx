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
import { Snowflake } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const schema = z.object({ reason: z.string().min(1, 'Reason is required') });
type FormValues = z.infer<typeof schema>;

export function FreezeDialog({
  onSubmit,
  loading,
}: {
  onSubmit: (reason: string) => void;
  loading: boolean;
}) {
  const [open, setOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { reason: '' },
  });

  function handleSubmit(values: FormValues) {
    onSubmit(values.reason);
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
        <Snowflake className="h-4 w-4 mr-2" />
        Freeze User
      </Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Freeze User</DialogTitle>
            <DialogDescription>
              The user's wallet will be locked until unfrozen.
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
                        placeholder="Reason for freezing"
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
                  {loading ? 'Freezing...' : 'Freeze'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
