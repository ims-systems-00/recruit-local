import { Skeleton } from '@/components/ui/skeleton';

export default function PostItemSkeleton() {
  return (
    <div className="rounded-2xl border border-border-gray-secondary flex flex-col items-center">
      <div className="w-full p-spacing-4xl space-y-spacing-4xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-spacing-lg">
          <div className="flex items-center gap-spacing-lg flex-1">
            <Skeleton className="h-12 w-12 rounded-full shrink-0" />

            <div className="flex-1 space-y-spacing-2xs">
              <Skeleton className="h-5 w-32" />

              <div className="flex items-center gap-spacing-sm">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-1.5 w-1.5 rounded-full" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
          </div>

          <Skeleton className="size-5 rounded-full" />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-8/12" />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-16 rounded-full" />
          <Skeleton className="h-5 w-20" />
        </div>
      </div>
    </div>
  );
}
