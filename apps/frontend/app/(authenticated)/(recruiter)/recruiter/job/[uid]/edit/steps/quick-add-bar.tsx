import { Plus } from 'lucide-react';
import { QueryType } from './additional-queries';

interface QuickAddBarProps {
  onAdd: (type: QueryType) => void;
}

const QUICK_TYPES: { type: QueryType; label: string }[] = [
  { type: 'single-choice', label: 'Single choice' },
  { type: 'multiple-choice', label: 'Multiple choice' },
  { type: 'short-answer', label: 'Short Answer' },
  { type: 'paragraph', label: 'Paragraph' },
];

export function QuickAddBar({ onAdd }: QuickAddBarProps) {
  return (
    <div className="flex items-center gap-spacing-xs flex-wrap">
      {QUICK_TYPES.map(({ type, label }) => (
        <button
          key={type}
          onClick={() => onAdd(type)}
          className="flex items-center gap-spacing-2xs text-label-xs text-text-gray-secondary border border-border-gray-primary rounded-lg px-spacing-md py-spacing-2xs hover:border-border-brand-primary hover:text-text-brand-secondary transition-colors bg-white"
        >
          <Plus className="w-3 h-3" />
          {label}
        </button>
      ))}
    </div>
  );
}
