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
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const schema = z.object({ notes: z.string() });
type FormValues = z.infer<typeof schema>;

export function ActionDialog({
  title,
  description,
  label,
  placeholder,
  confirmLabel,
  confirmVariant,
  icon,
  triggerLabel,
  triggerVariant,
  loading,
  disabled,
  onSubmit,
}: {
  title: string;
  description: string;
  label: string;
  placeholder: string;
  confirmLabel: string;
  confirmVariant: 'default' | 'destructive';
  icon: React.ReactNode;
  triggerLabel: string;
  triggerVariant: 'default' | 'destructive';
  loading: boolean;
  disabled: boolean;
  onSubmit: (notes: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { notes: '' },
  });

  function handleSubmit(values: FormValues) {
    onSubmit(values.notes);
    setOpen(false);
    form.reset();
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) form.reset();
  }

  return (
    <>
      <Button
        variant={triggerVariant}
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="w-full"
      >
        {icon}
        {triggerLabel}
      </Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <FormControl>
                      <Input placeholder={placeholder} autoFocus {...field} />
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
                <Button type="submit" variant={confirmVariant} disabled={loading}>
                  {loading ? 'Processing…' : confirmLabel}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
