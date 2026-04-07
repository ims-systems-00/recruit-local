import {
  AlignLeft,
  ArrowRight,
  CheckSquare,
  CircleDot,
  Pilcrow,
} from 'lucide-react';
import { QueryType } from './additional-queries';

interface InitialQuickAddBarProps {
  onAdd: (type: QueryType) => void;
}

const QUICK_TYPES: {
  type: QueryType;
  label: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    type: 'multiple-choice',
    label: 'Multiple Choice',
    description: 'Select multiple options',
    icon: CheckSquare,
  },
  {
    type: 'paragraph',
    label: 'Paragraph',
    description: 'Long text answer',
    icon: Pilcrow,
  },
  {
    type: 'single-choice',
    label: 'Single Choice',
    description: 'Select only one option',
    icon: CircleDot,
  },
  {
    type: 'short-answer',
    label: 'Short Answer',
    description: 'User writes a short response',
    icon: AlignLeft,
  },
];

export function InitialQuickAddBar({ onAdd }: InitialQuickAddBarProps) {
  return (
    <div className=" grid grid-cols-2 gap-spacing-2xl">
      {QUICK_TYPES.map(({ type, label, description, icon: Icon }) => (
        <div
          key={type}
          onClick={() => onAdd(type)}
          className=" group hover:border-border-brand-primary cursor-pointer rounded-2xl border border-border-gray-secondary p-spacing-4xl flex gap-spacing-lg items-start justify-between shadow-xs"
        >
          <div className="flex gap-spacing-lg items-start">
            <div className=" p-spacing-xl rounded-xl w-12 h-12 bg-others-gray-gray-zero flex items-center justify-center">
              <Icon className="w-5 h-5 text-others-gray-dark group-hover:text-text-brand-secondary" />
            </div>
            <div className=" space-y-spacing-3xs">
              <p className=" text-label-md font-label-md-strong! text-text-gray-primary group-hover:text-text-brand-secondary">
                {label}
              </p>
              <p className="text-label-sm text-fg-gray-tertiary group-hover:text-text-brand-secondary">
                {description}
              </p>
            </div>
          </div>
          <span>
            <ArrowRight className=" w-4 h-4 text-fg-gray-secondary group-hover:text-text-brand-secondary" />
          </span>
        </div>
      ))}
    </div>
  );
}
