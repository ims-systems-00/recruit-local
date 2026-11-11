'use client';

import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';

// The import is one request that reports no progress of its own, so the bar
// moves on time instead: every TICK_MS it closes STEP of the gap to CEILING.
// That is about half-way after 10 seconds and 85% after 30, and it never
// reaches CEILING, so a slow CV (up to a minute) does not sit at 100%. The
// modal moves on as soon as the import answers.
const TICK_MS = 500;
const STEP = 0.04;
const CEILING = 95;

/** "Processing Your CV": what is happening now, and a bar that keeps moving. */
export default function ImportCvProgressSection({ label }: { label: string }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(
      () => setProgress((value) => value + (CEILING - value) * STEP),
      TICK_MS,
    );
    return () => clearInterval(timer);
  }, []);

  const percent = Math.round(progress);

  return (
    <div className="space-y-spacing-lg">
      <p aria-live="polite" className="text-label-sm text-text-gray-tertiary">
        {label}
      </p>
      <div className="flex items-center gap-spacing-xl">
        <Progress value={percent} aria-label={label} className="h-2.5 flex-1" />
        <span className="w-10 shrink-0 text-right text-label-sm text-text-gray-secondary">
          {percent}%
        </span>
      </div>
    </div>
  );
}
