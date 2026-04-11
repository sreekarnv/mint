import { Button } from '@/components/ui/button';
import { UserSearchResult } from '@/lib/api/admin';
import { authApi } from '@/lib/api/auth';
import { Category, transactionsApi } from '@/lib/api/transactions';
import { queryKeys } from '@/lib/query-keys';
import { cn } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowLeftRight,
  Check,
  Loader2,
  Plus,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Amount } from '../shared/amount';
import { CurrencyInput } from '../shared/currency-input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Textarea } from '../ui/textarea';

function DepositForm({
  onSubmit,
  loading,
}: {
  onSubmit: (d: { amount: number; description?: string }) => void;
  loading: boolean;
}) {
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState('');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ amount, description: description || undefined });
      }}
      className="space-y-4"
    >
      <CurrencyInput label="Amount" value={amount} onChange={setAmount} />
      <div className="space-y-2">
        <Label>Description (optional)</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What's this deposit for?"
          rows={2}
        />
      </div>
      <Button
        type="submit"
        className="w-full"
        disabled={loading || amount <= 0}
      >
        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        {loading ? 'Processing…' : 'Deposit Funds'}
      </Button>
    </form>
  );
}

const CATEGORIES = [
  'FOOD',
  'TRANSPORT',
  'ENTERTAINMENT',
  'UTILITIES',
  'OTHER',
] as const;

function TransferForm({
  onSubmit,
  loading,
}: {
  onSubmit: (d: {
    recipientId: string;
    amount: number;
    category?: string;
    description?: string;
  }) => void;
  loading: boolean;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [recipient, setRecipient] = useState<UserSearchResult | null>(null);
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    setRecipient(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const users = await authApi.searchUsers(val);
        setResults(users);
        setShowDropdown(users.length > 0);
      } catch {
        setResults([]);
        setShowDropdown(false);
      } finally {
        setSearching(false);
      }
    }, 300);
  }

  function pickRecipient(u: UserSearchResult) {
    setRecipient(u);
    setQuery(u.email);
    setResults([]);
    setShowDropdown(false);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!recipient) return;
        onSubmit({
          recipientId: recipient.id,
          amount,
          category: category || undefined,
          description: description || undefined,
        });
      }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label>Recipient</Label>
        <div className="relative">
          <Input
            value={query}
            onChange={handleQueryChange}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            onFocus={() =>
              results.length > 0 && !recipient && setShowDropdown(true)
            }
            placeholder="Search by email…"
            autoComplete="off"
          />
          {searching && (
            <p className="text-xs text-muted-foreground mt-1">Searching…</p>
          )}
          {showDropdown && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
              {results.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pickRecipient(u)}
                  className="w-full text-left px-3 py-2.5 text-sm hover:bg-accent flex flex-col gap-0.5 transition-colors"
                >
                  <span className="font-medium">{u.name ?? u.email}</span>
                  {u.name && (
                    <span className="text-xs text-muted-foreground">
                      {u.email}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
          {recipient && (
            <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
              <Check className="h-3 w-3" /> Sending to{' '}
              {recipient.name ?? recipient.email}
            </p>
          )}
        </div>
      </div>

      <CurrencyInput label="Amount" value={amount} onChange={setAmount} />

      <div className="space-y-2">
        <Label>Category (optional)</Label>
        <Select value={category} onValueChange={(v) => setCategory(v || '')}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c.charAt(0) + c.slice(1).toLowerCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Note (optional)</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What's this for?"
          rows={2}
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={loading || amount <= 0 || !recipient}
      >
        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        {loading ? 'Processing…' : 'Send Money'}
      </Button>
    </form>
  );
}

function WalletBox({ wallet, isLoading }: any) {
  const queryClient = useQueryClient();
  const [depositOpen, setDepositOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);

  const topupMutation = useMutation({
    mutationFn: (body: { amount: number; description?: string }) =>
      transactionsApi.topup({
        amount: body.amount,
        description: body.description,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.root() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.transactions.list(),
      });
      setDepositOpen(false);
      toast.success('Deposit successful');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const transferMutation = useMutation({
    mutationFn: (body: {
      recipientId: string;
      amount: number;
      category?: string;
      description?: string;
    }) =>
      transactionsApi.transfer({
        recipientId: body.recipientId,
        amount: body.amount,
        category: body.category as Category | undefined,
        description: body.description,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.root() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.transactions.list(),
      });
      setTransferOpen(false);
      toast.success('Transfer successful');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const isFrozen = wallet?.status === 'frozen';

  return (
    <>
      {isFrozen && (
        <div className="flex items-start gap-3 bg-destructive/8 border border-destructive/20 rounded-xl p-4">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-destructive">
              Wallet frozen
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Contact support for assistance.
            </p>
          </div>
        </div>
      )}

      <div
        className="relative rounded-2xl overflow-hidden p-6"
        style={{
          background:
            'linear-gradient(135deg, #1D4ED8 0%, #1E40AF 55%, #172554 100%)',
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }}
        />
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/55">
              Available Balance
            </p>
            {wallet && (
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-white/70 bg-white/10 border border-white/15 rounded-full px-2.5 py-1">
                <span
                  className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    wallet.status === 'active'
                      ? 'bg-emerald-400'
                      : 'bg-red-400',
                  )}
                />
                {wallet.status}
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="h-14 w-48 bg-white/15 rounded-lg mb-5 animate-pulse" />
          ) : (
            <p
              className="text-5xl font-semibold tabular-nums leading-none text-white mt-1 mb-1"
              style={{ fontFamily: 'var(--font-display), Georgia, serif' }}
            >
              <Amount
                overrideColor="text-green-300"
                cents={wallet?.balance ?? 0}
              />
            </p>
          )}

          <p className="text-[11px] text-white/40 mt-2 mb-5">
            {wallet?.currency ?? 'USD'} · Personal wallet
          </p>

          <div className="flex gap-2">
            <Button
              size="sm"
              className="bg-white text-primary hover:bg-white/90 border-0 font-semibold"
              disabled={isFrozen}
              onClick={() => setDepositOpen(true)}
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Deposit
            </Button>
            <Button
              size="sm"
              className="bg-transparent border border-white/25 text-white hover:bg-white/10 hover:text-white"
              disabled={isFrozen}
              onClick={() => setTransferOpen(true)}
            >
              <ArrowLeftRight className="h-3.5 w-3.5 mr-1.5" />
              Send Money
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deposit Funds</DialogTitle>
            <DialogDescription>Add money to your wallet</DialogDescription>
          </DialogHeader>
          <DepositForm
            onSubmit={(d) => topupMutation.mutate(d)}
            loading={topupMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Money</DialogTitle>
            <DialogDescription>
              Transfer funds to another user
            </DialogDescription>
          </DialogHeader>
          <TransferForm
            onSubmit={(d) => transferMutation.mutate(d)}
            loading={transferMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

export default WalletBox;
