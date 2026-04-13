import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, Clock, EllipsisVertical, Grip } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Applicant } from './data';

interface Props {
  applicant: Applicant;
  onEdit: (applicant: Applicant) => void;
  onDelete: (id: string) => void;
}

const statusStyles: Record<string, string> = {
  Started:
    'text-others-brand-dark bg-others-brand-brand-zero border-others-brand-light',
  'In Progress':
    'text-others-warning-dark bg-others-warning-warning-zero border-others-warning-light',
  'On Going':
    'text-others-success-dark bg-others-success-success-zero border-others-success-light',
};

export function ApplicantCard({ applicant, onEdit, onDelete }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: applicant.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-bg-gray-soft-primary p-spacing-2xl flex flex-col gap-spacing-4xl rounded-2xl border border-border-gray-secondary shadow-xs"
    >
      {/* Top row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-spacing-sm">
          <span
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing touch-none text-fg-gray-secondary"
          >
            <Grip size={20} />
          </span>
          <span className=" text-label-sm text-text-gray-tertiary">
            {applicant.num}
          </span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="text-fg-gray-secondary">
              <EllipsisVertical size={20} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32 bg-white">
            <DropdownMenuItem onClick={() => onEdit(applicant)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete(applicant.id)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Avatar + name + status */}
      <div className="flex items-center gap-spacing-lg">
        <img
          src={applicant.avatarUrl}
          alt={applicant.name}
          className="w-12 h-12 rounded-full object-cover shrink-0 border border-border-gray-tertiary"
        />
        <div className="min-w-0 space-y-spacing-3xs">
          <div className="flex items-center gap-spacing-sm flex-wrap">
            <span className="text-label-lg font-label-lg-strong! text-text-gray-primary truncate">
              {applicant.name}
            </span>
            <span
              className={`  text-label-xs font-label-xs-strong! px-spacing-sm py-spacing-3xs rounded-full whitespace-nowrap border ${statusStyles[applicant.status] ?? 'text-others-brand-dark bg-others-brand-brand-zero border-others-brand-light'}`}
            >
              {applicant.status}
            </span>
          </div>
          <p className="text-label-sm text-text-gray-tertiary truncate">
            {applicant.email}
          </p>
        </div>
      </div>

      {/* Applied date/time */}
      <div className="flex items-center justify-between">
        <span className=" text-label-sm font-label-sm-strong! text-text-gray-tertiary">
          Applied on
        </span>
        <div className=" flex gap-spacing-sm items-center">
          <span className="flex items-center gap-spacing-2xs bg-others-gray-gray-zero py-spacing-3xs px-spacing-md rounded-full border border-others-gray-light ">
            <Calendar size={12} className=" text-others-gray-default" />
            <span className=" text-label-sm font-label-sm-strong! text-others-gray-dark">
              {applicant.appliedDate}
            </span>
          </span>
          <span className="flex items-center gap-spacing-2xs bg-others-gray-gray-zero py-spacing-3xs px-spacing-md rounded-full border border-others-gray-light">
            <Clock size={12} className=" text-others-gray-default" />
            <span className=" text-label-sm font-label-sm-strong! text-others-gray-dark">
              {applicant.appliedTime}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
