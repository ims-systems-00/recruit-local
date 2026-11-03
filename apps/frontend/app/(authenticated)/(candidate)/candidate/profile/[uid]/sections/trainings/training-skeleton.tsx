export default function TrainingSkeleton() {
  return (
    <div className="bg-bg-gray-soft-primary rounded-2xl border border-border-gray-secondary shadow-xs p-spacing-4xl animate-pulse">
      <div className="flex justify-between items-start gap-spacing-4xl">
        <div className="flex gap-spacing-2xl">
          {/* Certificate preview */}
          <div className="shrink-0 w-18 h-13 rounded-lg bg-gray-200" />

          <div className="space-y-spacing-xs w-full">
            {/* Course name */}
            <div className="h-4 w-40 bg-gray-200 rounded-md" />

            {/* Organization + Years */}
            <div className="flex items-center gap-spacing-sm">
              <div className="h-3 w-24 bg-gray-200 rounded-md" />
              <div className="w-1.5 h-1.5 bg-gray-200 rounded-full" />
              <div className="h-3 w-20 bg-gray-200 rounded-md" />
            </div>

            {/* Skills */}
            <div className="h-3 w-32 bg-gray-200 rounded-md" />
          </div>
        </div>

        {/* Dropdown button */}
        <div className="w-5 h-5 bg-gray-200 rounded-md" />
      </div>
    </div>
  );
}
