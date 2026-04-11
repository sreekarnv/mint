import { Bell } from 'lucide-react';

function NotificationEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="relative mb-6">
        <div className="absolute inset-0 -m-6 rounded-full border border-border/40" />
        <div className="absolute inset-0 -m-12 rounded-full border border-border/25" />
        <div className="absolute inset-0 -m-[72px] rounded-full border border-border/15" />
        <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center relative z-10">
          <Bell className="h-6 w-6 text-muted-foreground/50" />
        </div>
      </div>
      <p className="text-sm font-semibold text-foreground mt-6">
        All caught up
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        No notifications yet — you're ahead of the curve.
      </p>
    </div>
  );
}

export default NotificationEmptyState;
