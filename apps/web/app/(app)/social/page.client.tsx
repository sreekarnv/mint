'use client';

import { ContactsTab } from '@/components/(app)/social/contacts-tab';
import { RequestsTab } from '@/components/(app)/social/requests-tab';
import { SplitsTab } from '@/components/(app)/social/splits-tab';
import { cn } from '@/lib/utils';
import { ArrowDownLeft, SplitSquareHorizontal, Users } from 'lucide-react';
import { parseAsStringLiteral, useQueryState } from 'nuqs';

const tabs = ['contacts', 'requests', 'splits'] as const;
type Tab = (typeof tabs)[number];

const tabConfig: {
  key: Tab;
  label: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  { key: 'contacts', label: 'Contacts', icon: Users },
  { key: 'requests', label: 'Requests', icon: ArrowDownLeft },
  { key: 'splits', label: 'Bill Splits', icon: SplitSquareHorizontal },
];

export function SocialClient() {
  const [tab, setTab] = useQueryState(
    'tab',
    parseAsStringLiteral(tabs).withDefault('contacts'),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1 border-b border-border">
        {tabConfig.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'contacts' && <ContactsTab />}
      {tab === 'requests' && <RequestsTab />}
      {tab === 'splits' && <SplitsTab />}
    </div>
  );
}
