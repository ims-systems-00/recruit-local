import React from 'react';
import {
  Copy,
  Trash2,
  GripVertical,
  Circle,
  CheckSquare,
  AlignLeft,
  AlignJustify,
  X,
  GripHorizontal,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { QueryCard, QueryType } from './additional-queries';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface QueryCardProps {
  card: QueryCard;
  onUpdate: (id: string, updates: Partial<QueryCard>) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onFocus: (id: string) => void;
}

const TYPE_ICONS: Record<QueryType, React.ReactNode> = {
  paragraph: <AlignJustify className="w-4 h-4" />,
  'single-choice': <Circle className="w-4 h-4" />,
  'multiple-choice': <CheckSquare className="w-4 h-4" />,
  'short-answer': <AlignLeft className="w-4 h-4" />,
};

const TYPE_LABELS: Record<QueryType, string> = {
  paragraph: 'Paragraph',
  'single-choice': 'Single Choice',
  'multiple-choice': 'Multiple Choice',
  'short-answer': 'Short Answer',
};

export function QueryCardComponent({
  card,
  onUpdate,
  onDuplicate,
  onDelete,
  onFocus,
}: QueryCardProps) {
  const addOption = () => {
    const newOptions = [...card.options, { id: crypto.randomUUID(), text: '' }];
    onUpdate(card.id, { options: newOptions });
  };

  const updateOption = (optId: string, text: string) => {
    const newOptions = card.options.map((o) =>
      o.id === optId ? { ...o, text } : o,
    );
    onUpdate(card.id, { options: newOptions });
  };

  const removeOption = (optId: string) => {
    onUpdate(card.id, { options: card.options.filter((o) => o.id !== optId) });
  };

  const isChoice =
    card.type === 'single-choice' || card.type === 'multiple-choice';

  return (
    <div
      className={cn(
        'rounded-2xl border bg-bg-gray-soft-primary  transition-all shadow-xs border-border-gray-secondary',
        card.focused && 'border-border-brand-primary',
      )}
      onClick={() => onFocus(card.id)}
    >
      <div className=" p-spacing-4xl flex gap-spacing-2xl items-start">
        <GripHorizontal className="w-5 h-5 text-fg-gray-secondary cursor-grab min-w-fit" />

        <div className=" space-y-spacing-2xl flex-1">
          {/* Header row */}
          <div className="flex items-center gap-spacing-2xl">
            <input
              className={cn(
                'flex-1 h-10 text-label-md font-label-md-strong! border rounded-lg px-spacing-lg py-spacing-sm outline-none focus:border-border-brand-primary focus:ring-1 focus:ring-border-brand-primary transition-colors border-border-gray-secondary',
                card.focused && 'border-border-brand-primary',
              )}
              placeholder="Type your Queries"
              value={card.title}
              onChange={(e) => onUpdate(card.id, { title: e.target.value })}
              onClick={(e) => e.stopPropagation()}
            />
            <Select
              value={card.type}
              onValueChange={(val) =>
                onUpdate(card.id, { type: val as QueryType })
              }
            >
              <SelectTrigger className="min-w-44 text-sm h-9! ">
                <div className="flex items-center gap-2 text-label-md">
                  {/* {TYPE_ICONS[card.type]} */}
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white">
                {(Object.keys(TYPE_LABELS) as QueryType[]).map((t) => (
                  <SelectItem key={t} value={t}>
                    <div className="flex items-center gap-spacing-sm text-label-md">
                      {TYPE_ICONS[t]}
                      {TYPE_LABELS[t]}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Content area */}
          {isChoice ? (
            <div className="border border-border-gray-secondary bg-bg-gray-soft-primary rounded-lg p-spacing-lg space-y-spacing-2xl">
              {card.options.map((opt) => (
                <div key={opt.id} className="flex items-center gap-spacing-2xs">
                  {card.type === 'single-choice' ? (
                    <div className="w-4 h-4 rounded-full border border-border-gray-primary shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded border border-border-gray-primary shrink-0" />
                  )}
                  <input
                    className="flex-1 text-label-sm outline-none border-b border-transparent focus:border-border-gray-secondary py-spacing-3xs"
                    value={opt.text}
                    onChange={(e) => updateOption(opt.id, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeOption(opt.id);
                    }}
                    className="text-fg-gray-tertiary"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div
                className="flex items-center gap-spacing-2xs cursor-pointer text-text-gray-quinary "
                onClick={(e) => {
                  e.stopPropagation();
                  addOption();
                }}
              >
                {card.type === 'single-choice' ? (
                  <div className="w-4 h-4 rounded-full border border-border-gray-primary shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded border border-border-gray-primary shrink-0" />
                )}
                <span className=" text-label-sm">Add Option</span>
              </div>
            </div>
          ) : (
            <textarea
              className="w-full text-label-md border border-border-gray-secondary  rounded-lg px-spacing-lg py-spacing-sm text-text-gray-primary placeholder:text-text-gray-quaternary resize-none outline-none focus:border-border-brand-primary focus:ring-1 focus:ring-border-brand-primary h-24"
              placeholder="Write your thoughts here"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      </div>

      {/* Footer row */}
      <div className=" px-spacing-4xl py-spacing-2xl border-t border-border-gray-secondary flex items-center justify-between">
        <div className="flex items-center gap-spacing-sm">
          <span className="text-label-sm font-label-sm-strong! text-text-gray-primary">
            Required
          </span>

          <Switch
            checked={card.required}
            onCheckedChange={(v) => onUpdate(card.id, { required: v })}
            onClick={(e) => e.stopPropagation()}
            className=" bg-bg-gray-soft-quaternary data-[state=checked]:bg-bg-brand-solid-primary"
          />
        </div>
        <div className="flex items-center gap-spacing-2xl">
          <button
            className=" text-label-sm font-label-sm-strong! text-text-brand-secondary cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          >
            Set Expected Answer
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(card.id);
            }}
            type="button"
            className="text-fg-gray-secondary cursor-pointer hover:text-text-brand-secondary"
          >
            <Copy className="w-4 h-4 " />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(card.id);
            }}
            type="button"
            className="text-fg-gray-secondary hover:text-text-brand-secondary  cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
