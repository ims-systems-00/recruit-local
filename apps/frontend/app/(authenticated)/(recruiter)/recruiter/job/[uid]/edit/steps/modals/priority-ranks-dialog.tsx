'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Info } from 'lucide-react';
import {
  JOB_VALUE_PRIORITY_ENUMS,
  JOB_VALUE_PRIORITY_LABELS,
  JOB_VALUE_PRIORITY_WEIGHT,
} from '@rl/types';

interface PriorityRanksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// One dot per point of weight, out of the highest tier's.
const MAX_WEIGHT = Math.max(...Object.values(JOB_VALUE_PRIORITY_WEIGHT));

// Names and multipliers come from the shared constants, so this explains the
// same weights the matching uses.
const IMPACT_LEVELS = [
  { priority: JOB_VALUE_PRIORITY_ENUMS.ESSENTIAL, impact: 'Highest Impact' },
  {
    priority: JOB_VALUE_PRIORITY_ENUMS.HIGHLY_IMPORTANT,
    impact: 'High Impact',
  },
  { priority: JOB_VALUE_PRIORITY_ENUMS.IMPORTANT, impact: 'Medium Impact' },
  { priority: JOB_VALUE_PRIORITY_ENUMS.DESIRABLE, impact: 'Lower Impact' },
].map(({ priority, impact }) => ({
  name: JOB_VALUE_PRIORITY_LABELS[priority],
  dots: Array.from(
    { length: MAX_WEIGHT },
    (_, i) => i < JOB_VALUE_PRIORITY_WEIGHT[priority],
  ),
  multiplier: `x${JOB_VALUE_PRIORITY_WEIGHT[priority]}`,
  impact,
}));

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
              Allows you to rank and mathematically weight which skills or
              traits matter most when evaluating or scoring candidates.
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
