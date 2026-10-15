'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Info } from 'lucide-react';
import { VALUE_TYPE_ENUM, VALUE_TYPE_LABELS } from '@rl/types';

interface ValueCatalogueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Titles come from VALUE_TYPE_LABELS so every screen names a type the same way.
const CATEGORY_INFOS: {
  type: VALUE_TYPE_ENUM;
  description: string;
  fullWidth?: boolean;
}[] = [
  {
    type: VALUE_TYPE_ENUM.MINDSET,
    description: 'How you approach learning, growth, and adaptability.',
  },
  {
    type: VALUE_TYPE_ENUM.WORKING_STYLE,
    description: 'How you communicate, organize, and collaborate',
  },
  {
    type: VALUE_TYPE_ENUM.CULTURE_AND_BEHAVIOR,
    description: 'Your core ethical and interpersonal workplace values',
  },
  {
    type: VALUE_TYPE_ENUM.LEADERSHIP,
    description: 'How you prefer team support and leadership guidance.',
  },
  {
    type: VALUE_TYPE_ENUM.MOTIVATION,
    description: 'What drives your long-term engagement and fulfillment.',
    fullWidth: true,
  },
];

export function ValueCatalogueDialog({
  open,
  onOpenChange,
}: ValueCatalogueDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl rounded-2xl bg-white p-6 shadow-xl border border-border-gray-secondary">
        <DialogHeader className="space-y-3">
          <div className="w-10 h-10 rounded-xl bg-bg-brand-soft-primary border border-border-brand-primary flex items-center justify-center text-text-brand-primary">
            <Info className="w-5 h-5 text-text-brand-primary" />
          </div>
          <div>
            <DialogTitle className="text-label-lg font-label-lg-strong! text-text-gray-primary">
              Value Catalogue
            </DialogTitle>
            <p className="text-body-sm text-text-gray-tertiary mt-1 leading-relaxed">
              By selecting 1 to 5 values per category helps match candidates to
              your organisation&apos;s unique culture.
            </p>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          {CATEGORY_INFOS.map((cat) => (
            <div
              key={cat.type}
              className={`p-4 rounded-xl border border-border-gray-secondary bg-bg-gray-soft-primary ${
                cat.fullWidth ? 'md:col-span-2' : ''
              }`}
            >
              <h4 className="text-label-sm font-label-sm-strong! text-text-gray-primary mb-1">
                {VALUE_TYPE_LABELS[cat.type]}
              </h4>
              <p className="text-body-xs text-text-gray-tertiary leading-relaxed">
                {cat.description}
              </p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
