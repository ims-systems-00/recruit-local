import React from 'react';

const JobItemSkelaton = () => {
  return (
    <div className="border border-border-gray-secondary rounded-2xl bg-bg-gray-soft-primary shadow-xs animate-pulse">
      <div className="p-spacing-4xl space-y-spacing-4xl">
        {/* Header */}
        <div className="flex items-center gap-spacing-sm">
          <div className="w-12 h-12 rounded-full bg-gray-200" />

          <div className="space-y-2 w-full">
            <div className="h-4 w-2/3 bg-gray-200 rounded" />
            <div className="flex items-center gap-2">
              <div className="h-3 w-20 bg-gray-200 rounded" />
              <div className="w-px h-[13px] bg-gray-200" />
              <div className="h-3 w-24 bg-gray-200 rounded" />
            </div>
          </div>
        </div>

        {/* Meta Info */}
        <div className="flex items-center gap-spacing-sm">
          <div className="h-3 w-16 bg-gray-200 rounded" />
          <div className="w-1.5 h-1.5 bg-gray-200 rounded-full" />
          <div className="h-3 w-16 bg-gray-200 rounded" />
          <div className="w-1.5 h-1.5 bg-gray-200 rounded-full" />
          <div className="h-3 w-12 bg-gray-200 rounded" />
          <div className="w-1.5 h-1.5 bg-gray-200 rounded-full" />
          <div className="h-3 w-20 bg-gray-200 rounded" />
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border-gray-secondary flex justify-between items-center px-spacing-4xl py-spacing-2xl">
        <div className="h-6 w-20 bg-gray-200 rounded-md" />

        <div className="flex items-center gap-spacing-lg">
          <div className="h-9 w-28 bg-gray-200 rounded-lg" />
          <div className="h-9 w-9 bg-gray-200 rounded-lg" />
        </div>
      </div>
    </div>
  );
};

export default JobItemSkelaton;
