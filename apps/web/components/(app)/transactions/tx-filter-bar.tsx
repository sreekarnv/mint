'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TxnStatus, TxnType } from '@/lib/api/transactions';
import { X } from 'lucide-react';
import { allStatuses, allTypes, typeLabels } from './constants';

export function TxFilterBar({
  typeFilter,
  statusFilter,
  onTypeChange,
  onStatusChange,
  totalFiltered,
  isLoading,
}: {
  typeFilter: string;
  statusFilter: string;
  onTypeChange: (v: TxnType | 'all') => void;
  onStatusChange: (v: TxnStatus | 'all') => void;
  totalFiltered: number;
  isLoading: boolean;
}) {
  const hasFilter = typeFilter !== 'all' || statusFilter !== 'all';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={typeFilter} onValueChange={(v) => onTypeChange((v || 'all') as TxnType | 'all')}>
        <SelectTrigger className="w-40 h-8 text-xs">
          <SelectValue placeholder="All types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          {allTypes.map((t) => (
            <SelectItem key={t} value={t}>
              {typeLabels[t] ?? t}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={statusFilter} onValueChange={(v) => onStatusChange((v || 'all') as TxnStatus | 'all')}>
        <SelectTrigger className="w-40 h-8 text-xs">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          {allStatuses.map((s) => (
            <SelectItem key={s} value={s}>
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilter && (
        <button
          onClick={() => { onTypeChange('all'); onStatusChange('all'); }}
          className="flex items-center gap-1.5 px-3 h-8 rounded-md text-xs text-muted-foreground hover:text-foreground border border-border hover:border-foreground/20 transition-colors"
        >
          <X className="h-3 w-3" />
          Clear
        </button>
      )}

      {!isLoading && (
        <span className="text-xs text-muted-foreground ml-auto">
          {totalFiltered} {totalFiltered === 1 ? 'transaction' : 'transactions'}
          {hasFilter && <span className="text-muted-foreground/60"> (filtered)</span>}
        </span>
      )}
    </div>
  );
}
