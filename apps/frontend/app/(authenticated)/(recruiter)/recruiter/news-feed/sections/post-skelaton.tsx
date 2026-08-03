import { Skeleton } from '@/components/ui/skeleton';
import React from 'react';

export default function PostSkelaton() {
  return (
    <div className="rounded-2xl border border-border-gray-secondary flex flex-col">
      <div className="p-spacing-4xl space-y-spacing-4xl w-full">
        {/* Header */}
        <div className="flex justify-between items-start gap-spacing-lg">
          <div className="flex items-center gap-spacing-lg">
            <Skeleton className="h-10 w-10 rounded-full" />

            <div className="space-y-spacing-sm">
              <Skeleton className="h-5 w-52" />
              <div className="flex items-center gap-spacing-sm">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-1.5 w-1.5 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </div>

          <Skeleton className="h-5 w-5 rounded-md" />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>

        {/* Like Count */}
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>

      {/* Footer */}
      <div className="border-t border-border-gray-secondary py-spacing-2xl px-spacing-4xl">
        <div className="grid grid-cols-3 gap-spacing-2xl">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="flex items-center justify-center gap-spacing-2xs"
            >
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
