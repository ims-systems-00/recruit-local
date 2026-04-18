import React from 'react';

export default function JobItemSkelaton() {
  return (
    <div className="border border-border-gray-secondary rounded-2xl bg-bg-gray-soft-primary shadow-xs animate-pulse">
      <div className="p-spacing-4xl space-y-spacing-4xl">
        {/* Top section */}
        <div className="space-y-spacing-sm">
          <div className="flex justify-between items-center">
            <div className="h-3 w-16 bg-gray-200 rounded" />
            <div className="h-5 w-5 bg-gray-200 rounded" />
          </div>

          <div className="h-5 w-20 bg-gray-200 rounded-full" />

          <div className="space-y-spacing-2xs">
            <div className="h-5 w-3/4 bg-gray-200 rounded" />
            <div className="flex items-center gap-spacing-xs">
              <div className="h-4 w-40 bg-gray-200 rounded" />
              <div className="h-4 w-20 bg-gray-200 rounded" />
            </div>
          </div>
        </div>

        {/* Middle section */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-spacing-sm">
            <div className="h-4 w-16 bg-gray-200 rounded" />
            <div className="h-4 w-6 bg-gray-200 rounded" />
          </div>

          <div className="flex items-center">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="size-6 rounded-full bg-gray-200 border border-white -ml-1.5 first:ml-0"
              />
            ))}
            <div className="size-6 rounded-full bg-gray-200 border border-white -ml-1.5" />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border-gray-secondary flex justify-between items-center px-spacing-4xl py-spacing-2xl">
        <div className="h-3 w-20 bg-gray-200 rounded" />
        <div className="h-3 w-14 bg-gray-200 rounded" />
      </div>
    </div>
  );
}
