import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Applicant } from './data';
import { ApplicantCard } from './applicant-card';

interface Props {
  id: string;
  title: string;
  applicants: Applicant[];
  onAddClick: (columnId: string) => void;
  onEdit: (applicant: Applicant) => void;
  onDelete: (id: string) => void;
  onRenameColumn: (columnId: string, newTitle: string) => void;
  onDeleteColumn: (columnId: string) => void;
}

export function KanbanColumn({
  id,
  title,
  applicants,
  onAddClick,
  onEdit,
  onDelete,
  onRenameColumn,
  onDeleteColumn,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({ id });

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

  return (
    <div className="flex flex-col gap-spacing-2xl flex-1 min-w-[363px] max-w-[363px] bg-bg-gray-soft-secondary p-spacing-sm rounded-3xl border border-border-gray-secondary">
      {/* Column header */}
      <div className="flex items-center justify-between bg-bg-gray-soft-primary py-spacing-sm px-spacing-lg gap-spacing-lg rounded-2xl border border-border-gray-secondary">
        <div className="flex items-center gap-2">
          <span className=" text-label-md font-label-md-strong! text-text-gray-primary">
            {title}
          </span>
          <span className=" py-spacing-3xs px-spacing-sm rounded-full border border-others-gray-light bg-others-gray-gray-zero text-label-xs font-label-xs-strong! text-others-gray-dark">
            {applicants.length}
          </span>
        </div>
        <div className="flex items-center gap-spacing-sm">
          <button
            onClick={() => onAddClick(id)}
            className=" text-fg-gray-secondary"
            title="Add applicant"
          >
            <Plus size={16} />
          </button>
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
        </div>
      </div>

      {/* Cards drop zone */}
      <div
        ref={setNodeRef}
        className={`flex flex-col gap-spacing-2xl flex-1 min-h-[120px] rounded-2xl transition-colors ${
          isOver ? 'bg-blue-50/60' : ''
        }`}
      >
        <SortableContext
          items={applicants.map((a) => a.id)}
          strategy={verticalListSortingStrategy}
        >
          {applicants.map((applicant) => (
            <ApplicantCard
              key={applicant.id}
              applicant={applicant}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
