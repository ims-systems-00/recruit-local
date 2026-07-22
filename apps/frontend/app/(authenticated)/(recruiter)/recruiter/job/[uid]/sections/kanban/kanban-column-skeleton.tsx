export function KanbanColumnSkeleton() {
  return (
    <div className="flex flex-col gap-4 flex-1 min-w-[363px] max-w-[363px] p-3 rounded-3xl border bg-gray-100 animate-pulse">
      {/* header */}
      <div className="h-10 bg-gray-200 rounded-xl" />

      {/* cards */}
      <div className="space-y-4 mt-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 bg-gray-200 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
