export default function WorkExperienceSkeleton() {
  return (
    <div className="bg-bg-gray-soft-primary rounded-2xl border border-border-gray-secondary shadow-xs p-spacing-4xl animate-pulse">
      <div className="flex justify-between items-start gap-spacing-4xl">
        <div className="flex gap-spacing-2xl">
          {/* Avatar */}
          <div className="min-w-12 max-w-12">
            <div className="w-12 h-12 rounded-full bg-gray-200" />
          </div>

          <div className="space-y-spacing-xs w-full">
            {/* Job Title */}
            <div className="h-4 w-40 bg-gray-200 rounded-md" />

            {/* Company + Type */}
            <div className="flex items-center gap-spacing-sm">
              <div className="h-3 w-24 bg-gray-200 rounded-md" />
              <div className="w-1.5 h-1.5 bg-gray-200 rounded-full" />
              <div className="h-3 w-20 bg-gray-200 rounded-md" />
            </div>

            {/* Date + Duration */}
            <div className="flex items-center gap-spacing-sm">
              <div className="h-3 w-32 bg-gray-200 rounded-md" />
              <div className="w-1.5 h-1.5 bg-gray-200 rounded-full" />
              <div className="h-3 w-16 bg-gray-200 rounded-md" />
            </div>
          </div>
        </div>

        {/* Dropdown button */}
        <div className="w-5 h-5 bg-gray-200 rounded-md" />
      </div>
    </div>
  );
}
