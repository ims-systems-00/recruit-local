import { Skeleton } from '@/components/ui/skeleton';

export default function ArticleItemSkeleton() {
  return (
    <div className="rounded-2xl border border-border-gray-secondary flex flex-col items-center">
      <div className="w-full p-spacing-4xl space-y-spacing-4xl">
        {/* Title & Menu */}
        <div className="flex items-start justify-between gap-spacing-lg">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-11/12" />
            <Skeleton className="h-5 w-8/12" />
          </div>

          <Skeleton className="size-5 rounded-full" />
        </div>

        {/* Banner */}
        <Skeleton className="h-[120px] w-full rounded-xl" />

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>

          <Skeleton className="h-8 w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
}
