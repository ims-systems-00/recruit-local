import React from 'react';

export default function VerificationSkelaton() {
  return (
    <div className="p-spacing-4xl space-y-spacing-4xl animate-pulse">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-spacing-2xs">
          <div className="h-7 w-56 rounded bg-gray-200" />
          <div className="h-4 w-72 rounded bg-gray-200" />
        </div>
      </div>

      {/* Verification Status Card */}
      <div className="rounded-2xl border border-border-gray-secondary p-spacing-4xl flex flex-col gap-spacing-4xl">
        <div className="space-y-spacing-lg">
          <div className="h-5 w-40 rounded bg-gray-200" />
          <div className="h-8 w-28 rounded-md bg-gray-200" />
        </div>
      </div>
      <div className="space-y-spacing-xs">
        <div className="h-5 w-48 rounded bg-gray-200" />

        <div className="space-y-spacing-lg">
          {/* Front Document */}
          <div className="flex items-center gap-spacing-md rounded-xl border border-border-gray-secondary p-spacing-lg">
            <div className="h-12 w-12 rounded-lg bg-gray-200 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 rounded bg-gray-200" />
              <div className="h-3 w-28 rounded bg-gray-200" />
            </div>
          </div>

          {/* Back Document */}
          <div className="flex items-center gap-spacing-md rounded-xl border border-border-gray-secondary p-spacing-lg">
            <div className="h-12 w-12 rounded-lg bg-gray-200 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 rounded bg-gray-200" />
              <div className="h-3 w-28 rounded bg-gray-200" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
