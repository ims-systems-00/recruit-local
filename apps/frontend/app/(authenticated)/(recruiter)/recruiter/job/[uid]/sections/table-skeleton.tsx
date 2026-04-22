import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type TableSkeletonProps = {
  columns: number;
  rows?: number;
};

export function TableSkeleton({ columns = 10, rows = 5 }: TableSkeletonProps) {
  return (
    <div className="overflow-hidden animate-pulse">
      <Table>
        {/* Header */}
        <TableHeader>
          <TableRow className="border-border-gray-primary">
            {Array.from({ length: columns }).map((_, i) => (
              <TableHead
                key={i}
                className="bg-bg-gray-soft-secondary! p-spacing-2xl!"
              >
                <div className="h-4 w-24 bg-gray-200 rounded" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        {/* Body */}
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <TableCell key={colIndex} className="p-spacing-2xl!">
                  <div className="h-4 w-full bg-gray-200 rounded" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
