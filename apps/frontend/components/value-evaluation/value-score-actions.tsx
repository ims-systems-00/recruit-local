'use client';
import { ArrowRight, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * The score pill and evaluate button shown on a selected value row.
 *
 * `score` undefined means never evaluated: shown as 0% with "Let's Evaluate".
 * Once a score exists the button becomes "Start Again".
 */
export default function ValueScoreActions({
  score,
  onEvaluate,
}: {
  score?: number;
  onEvaluate: () => void;
}) {
  return (
    <div className=" ml-auto flex items-center gap-spacing-md">
      <span className=" whitespace-nowrap inline-flex items-center justify-center min-h-6 py-spacing-3xs px-spacing-md rounded-lg border border-border-gray-primary text-label-sm font-label-sm-strong! text-others-gray-dark">
        Score : {score ?? 0}%
      </span>
      {score === undefined ? (
        <Button
          type="button"
          size="sm"
          onClick={onEvaluate}
          className=" h-8 rounded-lg bg-bg-brand-solid-primary text-white! text-label-sm font-label-sm-strong! cursor-pointer"
        >
          Let&apos;s Evaluate
          <ArrowRight />
        </Button>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onEvaluate}
          className=" h-8 rounded-lg border-border-gray-primary text-label-sm font-label-sm-strong! text-text-gray-secondary cursor-pointer"
        >
          Start Again
          <RotateCw />
        </Button>
      )}
    </div>
  );
}
