import { QUERY_TYPE_ENUMS } from '@rl/types';
import { Plus } from 'lucide-react';

interface QuickAddBarProps {
  onAdd: (type: QUERY_TYPE_ENUMS) => void;
}

const QUICK_TYPES: { type: QUERY_TYPE_ENUMS; label: string }[] = [
  { type: QUERY_TYPE_ENUMS.SINGLE_CHOICE, label: 'Single choice' },
  { type: QUERY_TYPE_ENUMS.MULTIPLE_CHOICE, label: 'Multiple choice' },
  { type: QUERY_TYPE_ENUMS.SHORT_ANSWER, label: 'Short Answer' },
  { type: QUERY_TYPE_ENUMS.PARAGRAPH, label: 'Paragraph' },
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
