'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi, type UserSearchResult } from '@/lib/api/auth';
import debounce from 'lodash/debounce';
import { Check } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

export function UserSearchInput({
  label,
  onSelect,
  placeholder = 'Search by email…',
}: {
  label: string;
  onSelect: (user: UserSearchResult) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [show, setShow] = useState(false);
  const [selected, setSelected] = useState<UserSearchResult | null>(null);

  const debouncedSearch = useMemo(
    () =>
      debounce(async (val: string) => {
        setSearching(true);
        try {
          const users = await authApi.searchUsers(val);
          setResults(users);
          setShow(users.length > 0);
        } catch {
          setResults([]);
          setShow(false);
        } finally {
          setSearching(false);
        }
      }, 300),
    [],
  );

  useEffect(() => {
    return () => debouncedSearch.cancel();
  }, [debouncedSearch]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    setSelected(null);
    if (val.length < 2) {
      debouncedSearch.cancel();
      setResults([]);
      setShow(false);
      return;
    }
    debouncedSearch(val);
  }

  function pick(u: UserSearchResult) {
    setSelected(u);
    setQuery(u.email);
    setResults([]);
    setShow(false);
    onSelect(u);
  }

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <div className="relative">
        <Input
          value={query}
          onChange={handleChange}
          onBlur={() => setTimeout(() => setShow(false), 150)}
          onFocus={() => results.length > 0 && !selected && setShow(true)}
          placeholder={placeholder}
          autoComplete="off"
        />
        {searching && (
          <p className="text-xs text-muted-foreground mt-1">Searching…</p>
        )}
        {show && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
            {results.map((u) => (
              <button
                key={u.id}
                type="button"
                className="w-full text-left px-3 py-2.5 text-sm hover:bg-accent flex flex-col gap-0.5 transition-colors"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(u)}
              >
                <span className="font-medium">{u.name ?? u.email}</span>
                {u.name && (
                  <span className="text-xs text-muted-foreground">{u.email}</span>
                )}
              </button>
            ))}
          </div>
        )}
        {selected && (
          <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
            <Check className="h-3 w-3" /> {selected.name ?? selected.email}
          </p>
        )}
      </div>
    </div>
  );
}
