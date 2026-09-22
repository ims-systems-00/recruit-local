'use client';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

import { chipMotion } from '@/lib/motion';
import { cn } from '@/lib/utils';

type RemovableChipProps = {
  label: string;
  onRemove: () => void;
  className?: string;
};

export function RemovableChip({
  label,
  onRemove,
  className,
}: RemovableChipProps) {
  return (
    <motion.span
      layout
      {...chipMotion}
      data-slot="removable-chip"
      className={cn(
        ' whitespace-nowrap inline-flex items-center justify-center gap-spacing-2xs min-h-6 py-spacing-3xs px-spacing-md rounded-lg bg-bg-gray-soft-primary text-body-xs text-others-gray-dark border border-border-gray-primary',
        className,
      )}
    >
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label}`}
        className=" cursor-pointer inline-flex items-center justify-center rounded-xs opacity-50 transition-opacity hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <X className=" pointer-events-none size-3" />
      </button>
    </motion.span>
  );
}
