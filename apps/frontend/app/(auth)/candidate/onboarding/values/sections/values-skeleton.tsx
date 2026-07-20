import { Skeleton } from '@/components/ui/skeleton';

export default function ValuesSkeleton() {
  return (
    <div className="flex items-center gap-spacing-lg p-spacing-2xl rounded-2xl border border-border-gray-secondary min-h-14">
      <Skeleton className="h-4 w-4 rounded-sm bg-gray-200" />
      <Skeleton className="h-4 w-40 bg-gray-200" />
    </div>
  );
}
