import type { HTMLAttributes, ReactNode, Ref } from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  GripVertical,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
// import type { Applicant } from './data';
import { cn } from '@/lib/utils';
import { ApplicantCard, ApplicantCardContent } from './applicant-card';
import { useInfiniteApplications } from '@/services/application/application.client';
import { Application } from '@/services/application/application.type';
import { KanbanColumnSkeleton } from './kanban-column-skeleton';

// The column's status id is already its card drop zone's id, and dnd-kit ids
// must be unique, so the column's own sortable gets a prefixed one.
export const columnSortableId = (statusId: string) => `column:${statusId}`;

const COLUMN_CLASS =
  'relative flex flex-col gap-spacing-2xl flex-1 min-w-[363px] max-w-[363px] bg-bg-gray-soft-secondary p-spacing-sm rounded-3xl border border-border-gray-secondary';

/** Server cards with in-flight moves applied: moved-in first, moved-out dropped. */
export const mergeColumnApplications = (
  applications: Application[],
  optimisticItems: Application[],
  removedIds: Set<string>,
) => [
  ...optimisticItems,
  ...applications.filter(
    (a) =>
      !optimisticItems.some((o) => o._id === a._id) && !removedIds.has(a._id),
  ),
];

function ColumnHeader({
  title,
  count,
  handleRef,
  handleProps,
  actions,
}: {
  title: string;
  count: number;
  handleRef?: Ref<HTMLButtonElement>;
  handleProps?: HTMLAttributes<HTMLButtonElement>;
  actions: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between bg-bg-gray-soft-primary py-spacing-sm px-spacing-lg gap-spacing-lg rounded-2xl border border-border-gray-secondary">
      <div className="flex items-center gap-2">
        <button
          type="button"
          ref={handleRef}
          {...handleProps}
          className="cursor-grab active:cursor-grabbing touch-none text-fg-gray-secondary"
          aria-label={`Reorder ${title}`}
        >
          <GripVertical size={16} />
        </button>
        <span className=" text-label-md font-label-md-strong! text-text-gray-primary">
          {title}
        </span>
        <span className=" py-spacing-3xs px-spacing-sm rounded-full border border-others-gray-light bg-others-gray-gray-zero text-label-xs font-label-xs-strong! text-others-gray-dark">
          {count}
        </span>
      </div>
      <div className="flex items-center gap-spacing-sm">{actions}</div>
    </div>
  );
}

/**
 * What follows the pointer while a column is dragged. No dnd-kit hooks: the real
 * column stays mounted (as the drop placeholder) and owns the ids.
 */
export function KanbanColumnPreview({
  title,
  applications,
  count,
}: {
  title: string;
  applications: Application[];
  count: number;
}) {
  return (
    <div
      className={cn(
        COLUMN_CLASS,
        'max-h-[80vh] overflow-hidden cursor-grabbing shadow-2xl rotate-2',
      )}
    >
      <ColumnHeader
        title={title}
        count={count}
        actions={
          <span className="text-fg-gray-secondary">
            <MoreHorizontal size={16} />
          </span>
        }
      />
      <div className="flex flex-col gap-spacing-2xl">
        {applications.map((applicant) => (
          <ApplicantCardContent key={applicant._id} applicant={applicant} />
        ))}
      </div>
    </div>
  );
}

interface Props {
  id: string;
  title: string;
  // applicants: Applicant[];
  // onAddClick: (columnId: string) => void;
  // onEdit: (applicant: Applicant) => void;
  // onDelete: (id: string) => void;
  onRenameColumn: (columnId: string, newTitle: string) => void;
  onDeleteColumn: (columnId: string) => void;
  jobId: string;
  optimisticItems: Application[];
  removedIds: Set<string>;
}

export function KanbanColumn({
  id,
  title,
  // applicants,
  // onAddClick,
  // onEdit,
  // onDelete,
  onRenameColumn,
  onDeleteColumn,
  jobId,
  optimisticItems,
  removedIds,
}: Props) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteApplications({
      jobId,
      statusId: id,
    });

  const applications = data?.pages.flatMap((page) => page.docs) ?? [];

  const mergedApplications = mergeColumnApplications(
    applications,
    optimisticItems,
    removedIds,
  );

  const { setNodeRef, isOver } = useDroppable({ id });

  const {
    attributes,
    listeners,
    setNodeRef: setColumnNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: columnSortableId(id),
    data: { type: 'column', statusId: id },
  });

  const columnStyle = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const handleRename = () => {
    const newTitle = prompt('Rename section:', title);
    if (newTitle && newTitle.trim()) {
      onRenameColumn(id, newTitle.trim());
    }
  };

  const handleDeleteColumn = () => {
    if (confirm(`Delete section "${title}" and all its cards?`)) {
      onDeleteColumn(id);
    }
  };
  if (isLoading) return <KanbanColumnSkeleton />;

  return (
    <div
      ref={setColumnNodeRef}
      style={columnStyle}
      className={cn(
        COLUMN_CLASS,
        // While dragged, the column stays in the row as the landing spot: same
        // size, contents hidden, outlined. The preview follows the pointer.
        isDragging &&
          'border-2 border-dashed border-border-brand-primary bg-bg-brand-soft-primary',
      )}
    >
      <div className={cn('contents', isDragging && 'invisible')}>
        <ColumnHeader
          title={title}
          count={applications.length}
          handleRef={setActivatorNodeRef}
          handleProps={{ ...attributes, ...listeners }}
          actions={
            <>
              {/* <button
            onClick={() => onAddClick(id)}
            className=" text-fg-gray-secondary"
            title="Add applicant"
          >
            <Plus size={16} />
          </button> */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="text-fg-gray-secondary">
                    <MoreHorizontal size={16} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 bg-white">
                  <DropdownMenuItem onClick={handleRename}>
                    <Pencil size={13} className="mr-2" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={handleDeleteColumn}
                  >
                    <Trash2 size={13} className="mr-2" />
                    Delete section
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          }
        />

        {/* Cards drop zone */}
        <div
          ref={setNodeRef}
          className={`flex flex-col gap-spacing-2xl flex-1 min-h-[120px] rounded-2xl transition-colors ${
            isOver ? 'bg-blue-50/60' : ''
          }`}
        >
          <SortableContext
            items={mergedApplications.map((a) => a._id)}
            strategy={verticalListSortingStrategy}
          >
            {mergedApplications.map((applicant, index) => (
              <ApplicantCard
                key={applicant._id}
                applicant={applicant}
                index={index}
              />
            ))}
          </SortableContext>
          {hasNextPage && (
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="mt-spacing-2xl cursor-pointer text-label-sm font-label-sm-strong! text-text-brand-secondary"
            >
              {isFetchingNextPage ? 'Loading...' : 'Load more'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
