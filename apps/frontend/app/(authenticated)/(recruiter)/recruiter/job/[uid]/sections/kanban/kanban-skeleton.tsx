export function KanbanSkeleton() {
  return (
    <div className="flex gap-6 overflow-x-auto">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="min-w-[363px] max-w-[363px] p-4 rounded-2xl border bg-gray-100 animate-pulse"
        >
          {/* Column header */}
          <div className="h-10 bg-gray-200 rounded-xl mb-4" />

          {/* Cards */}
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="h-28 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
