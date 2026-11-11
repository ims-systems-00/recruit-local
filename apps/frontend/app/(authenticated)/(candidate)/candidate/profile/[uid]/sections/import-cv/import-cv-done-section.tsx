'use client';

import { CheckCheck, CircleAlert } from 'lucide-react';

/** One tab's part of the summary: what was ticked in it, by name. */
export interface SummaryGroup {
  title: string;
  items: string[];
  note?: string;
}

/**
 * The closing "Congratulations" summary: a chip for each item added, under
 * its tab's name, or "Nothing is updated" for a tab with none.
 */
export default function ImportCvDoneSection({
  groups,
}: {
  groups: SummaryGroup[];
}) {
  return (
    <div className="space-y-spacing-4xl">
      {groups.map(({ title, items, note }) => (
        <section key={title} className="space-y-spacing-xl">
          <div className="space-y-spacing-3xs">
            <p className="text-label-md font-label-md-strong! text-text-gray-secondary">
              {title}
            </p>
            {note && (
              <p className="text-label-sm text-text-gray-tertiary">{note}</p>
            )}
          </div>

          {items.length ? (
            <ul className="flex flex-wrap gap-spacing-lg">
              {items.map((item, index) => (
                <li
                  key={index}
                  className="inline-flex max-w-full items-center gap-spacing-sm rounded-md border border-border-gray-secondary bg-bg-gray-soft-secondary px-spacing-lg py-spacing-xs text-label-md text-text-gray-secondary"
                >
                  <CheckCheck className="size-4 shrink-0 text-fg-gray-tertiary" />
                  {/* A long job title stays on one line, in full on hover. */}
                  <span title={item} className="truncate">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="flex items-center gap-spacing-md text-label-md text-text-gray-tertiary">
              <CircleAlert className="size-5 shrink-0" />
              Nothing is updated
            </p>
          )}
        </section>
      ))}
    </div>
  );
}
