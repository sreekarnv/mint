'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { type UserSearchResult } from '@/lib/api/auth';
import { socialApi, type Contact } from '@/lib/api/social';
import { transactionsApi } from '@/lib/api/transactions';
import { queryKeys } from '@/lib/query-keys';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Loader2, Send, UserPlus, Users, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { UserAvatar as Avatar } from '@/components/shared/avatar';
import { SendMoneyForm } from './send-money-form';
import { UserSearchInput } from './user-search-input';

export function ContactsTab() {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [sendTarget, setSendTarget] = useState<Contact | null>(null);
  const [newContact, setNewContact] = useState<UserSearchResult | null>(null);

  const { data: contacts, isLoading } = useQuery({
    queryKey: queryKeys.social.contacts(),
    queryFn: () => socialApi.contacts.list(),
  });

  const addMutation = useMutation({
    mutationFn: (contactId: string) => socialApi.contacts.add({ contactId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.social.contacts() });
      setAddOpen(false);
      setNewContact(null);
      toast.success('Contact added');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const removeMutation = useMutation({
    mutationFn: (contactId: string) => socialApi.contacts.remove(contactId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.social.contacts() });
      toast.success('Contact removed');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const sendMutation = useMutation({
    mutationFn: (data: { recipientId: string; amount: number; description?: string }) =>
      transactionsApi.transfer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.root() });
      setSendOpen(false);
      setSendTarget(null);
      toast.success('Money sent');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {contacts?.length
            ? `${contacts.length} contact${contacts.length !== 1 ? 's' : ''}`
            : ''}
        </p>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <UserPlus className="h-3.5 w-3.5 mr-1.5" />
          Add Contact
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : !contacts?.length ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
            <Users className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No contacts yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Add contacts to quickly send money
          </p>
          <Button size="sm" className="mt-4" onClick={() => setAddOpen(true)}>
            <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Add your first contact
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {contacts.map((c) => (
            <div
              key={c.id}
              className="group relative rounded-xl border border-border bg-card p-4 hover:border-primary/30 hover:shadow-sm transition-all"
            >
              <div className="flex items-start gap-3 mb-4">
                <Avatar id={c.contactId} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {c.contactId.slice(0, 12)}…
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Since {format(new Date(c.createdAt), 'MMM yyyy')}
                  </p>
                </div>
                <button
                  onClick={() => removeMutation.mutate(c.contactId)}
                  disabled={removeMutation.isPending}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSendTarget(c);
                  setSendOpen(true);
                }}
              >
                <Send className="h-3.5 w-3.5 mr-1.5" />
                Send Money
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Contact</DialogTitle>
            <DialogDescription>Search for a user by email</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <UserSearchInput label="Search user" onSelect={(u) => setNewContact(u)} />
            <Button
              className="w-full"
              disabled={!newContact || addMutation.isPending}
              onClick={() => newContact && addMutation.mutate(newContact.id)}
            >
              {addMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              {addMutation.isPending ? 'Adding…' : 'Add Contact'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={sendOpen}
        onOpenChange={(o) => {
          setSendOpen(o);
          if (!o) setSendTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Money</DialogTitle>
            <DialogDescription>Transfer to {sendTarget?.contactId}</DialogDescription>
          </DialogHeader>
          <SendMoneyForm
            recipientId={sendTarget?.contactId ?? ''}
            onSubmit={(amount, description) =>
              sendMutation.mutate({
                recipientId: sendTarget!.contactId,
                amount,
                description,
              })
            }
            loading={sendMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
