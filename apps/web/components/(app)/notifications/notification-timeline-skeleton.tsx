import { Skeleton } from '@/components/ui/skeleton';

function NotificationTimelineSkeleton() {
  return (
    <div className="space-y-1">
      {[80, 72, 88, 72, 80].map((h, i) => (
        <div key={i} className="flex gap-5">
          <div className="relative shrink-0 mt-3.5 w-5 flex items-center justify-center">
            <Skeleton className="w-2.5 h-2.5 rounded-full" />
          </div>
          <Skeleton
            className={`flex-1 rounded-xl mb-2`}
            style={{ height: h }}
          />
        </div>
      ))}
    </div>
  );
}

export default NotificationTimelineSkeleton;
