'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Info } from 'lucide-react';

interface PriorityRanksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const IMPACT_LEVELS = [
  {
    name: 'Essentials',
    dots: [true, true, true, true],
    multiplier: 'x4',
    impact: 'Highest Impact',
  },
  {
    name: 'Highly Important',
    dots: [true, true, true, false],
    multiplier: 'x3',
    impact: 'High Impact',
  },
  {
    name: 'Important',
    dots: [true, true, false, false],
    multiplier: 'x2',
    impact: 'Medium Impact',
  },
  {
    name: 'Desirable',
    dots: [true, false, false, false],
    multiplier: 'x1',
    impact: 'Lower Impact',
  },
];

export function PriorityRanksDialog({
  open,
  onOpenChange,
}: PriorityRanksDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl bg-white p-6 shadow-xl border border-border-gray-secondary">
        <DialogHeader className="space-y-3">
          <div className="w-10 h-10 rounded-xl bg-bg-brand-soft-primary border border-border-brand-primary flex items-center justify-center text-text-brand-primary">
            <Info className="w-5 h-5 text-text-brand-primary" />
          </div>
          <div>
            <DialogTitle className="text-label-lg font-label-lg-strong! text-text-gray-primary">
              Priority ranks
            </DialogTitle>
            <p className="text-body-sm text-text-gray-tertiary mt-1 leading-relaxed">
              Allows you to rank and mathematically weight which skills or traits matter most when evaluating or scoring candidates.
            </p>
          </div>
        </DialogHeader>

        <div className="mt-4 pt-3 border-t border-border-gray-secondary">
          <h4 className="text-label-sm font-label-sm-strong! text-text-gray-secondary mb-3">
            Priority Impact on Candidate Matching
          </h4>
          <div className="space-y-3">
            {IMPACT_LEVELS.map((level) => (
              <div
                key={level.name}
                className="flex items-center justify-between text-body-sm py-1.5"
              >
                <span className="w-32 font-medium text-text-gray-primary text-sm">
                  {level.name}
                </span>

                <div className="flex items-center gap-1.5 w-20">
                  {level.dots.map((filled, idx) => (
                    <span
                      key={idx}
                      className={`w-2.5 h-2.5 rounded-full ${
                        filled
                          ? 'bg-bg-brand-solid-primary'
                          : 'border border-border-brand-primary bg-transparent'
                      }`}
                    />
                  ))}
                </div>

                <span className="w-12 text-center text-text-gray-secondary font-medium text-sm">
                  {level.multiplier}
                </span>

                <span className="w-28 text-right text-text-gray-secondary text-xs">
                  {level.impact}
                </span>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
