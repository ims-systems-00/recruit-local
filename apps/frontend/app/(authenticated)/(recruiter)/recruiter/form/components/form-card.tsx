import { Ellipsis } from 'lucide-react';

interface FormCardProps {
  id: string;
  name: string;
  updated: string;
  onClick?: () => void;
  onActionsClick?: () => void;
}

export function FormCard({
  id,
  name,
  updated,
  onClick,
  onActionsClick,
}: FormCardProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border-gray-secondary bg-white shadow-xs">
      <div className="relative h-40 bg-bg-gray-soft-secondary">
        <div className="absolute inset-x-6 top-6 rounded-lg border border-border-gray-secondary bg-white p-3 shadow-xs">
          <div className="h-2 w-16 rounded-full bg-bg-brand-soft-secondary" />
          <div className="mt-3 space-y-2">
            <div className="h-2 w-full rounded-full bg-bg-gray-soft-tertiary" />
            <div className="h-2 w-4/5 rounded-full bg-bg-gray-soft-tertiary" />
            <div className="h-2 w-3/5 rounded-full bg-bg-gray-soft-tertiary" />
          </div>
        </div>
      </div>
      <div className="space-y-spacing-2xs p-spacing-3xl">
        <p className="text-label-sm text-text-gray-tertiary">
          Updated {updated}
        </p>
        <div className="flex items-start justify-between gap-spacing-xl">
          <div className="space-y-spacing-3xs">
            <p className="text-label-lg font-label-lg-strong! text-text-gray-primary">
              {name}
            </p>
            <p className="text-label-sm text-text-gray-quaternary">{id}</p>
          </div>
          <button
            type="button"
            className="text-text-gray-tertiary transition hover:text-text-gray-primary"
            aria-label={`Open actions for ${name}`}
            onClick={(e) => {
              e.stopPropagation();
              onActionsClick?.();
            }}
          >
            <Ellipsis className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
