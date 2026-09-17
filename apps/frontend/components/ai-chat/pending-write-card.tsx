'use client';
import { AlertTriangle, Check, PencilLine } from 'lucide-react';
import type { PendingWriteItem } from '@/services/agent/agent.type';

/**
 * A change Alice has proposed but not saved.
 *
 * The buttons are shortcuts, not the mechanism: approval on the backend is an
 * ordinary chat reply, so "Save it" sends one and typing "yes" works just as
 * well. Once a newer message exists the card is `superseded` and its buttons are
 * hidden — approving an old proposal after the conversation has moved on would
 * be ambiguous, and the backend would reject its token anyway if the values
 * changed.
 */
export default function PendingWriteCard({
  item,
  superseded,
  disabled,
  onConfirm,
  onChange,
}: {
  item: PendingWriteItem;
  superseded: boolean;
  disabled: boolean;
  onConfirm: () => void;
  onChange: () => void;
}) {
  const entries = Object.entries(item.details ?? {});

  return (
    <section
      className="mt-spacing-sm rounded-xl border border-border-gray-secondary bg-white p-3"
      aria-label={`Proposed change: ${item.summary}`}
    >
      <p className="mb-2 text-label-xs font-semibold uppercase tracking-wide text-text-gray-quaternary">
        Not saved yet
      </p>
      <p className="mb-2 text-label-sm font-semibold text-text-gray-primary">
        {item.summary}
      </p>

      {entries.length > 0 && (
        <dl className="mb-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-label-xs">
          {entries.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-text-gray-quaternary">{label}</dt>
              <dd className="whitespace-pre-wrap break-words text-text-gray-primary">
                {Array.isArray(value) ? value.join(', ') : String(value)}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {item.warnings?.map((warning) => (
        <p
          key={warning}
          className="mb-2 flex items-start gap-1.5 rounded-md bg-[#fefce8] p-2 text-label-xs text-[#894b00]"
          role="note"
        >
          <AlertTriangle
            size={13}
            className="mt-[1px] shrink-0"
            aria-hidden="true"
          />
          {warning}
        </p>
      ))}

      {superseded ? (
        <p className="text-label-xs text-text-gray-quaternary">
          This proposal was replaced by a later message.
        </p>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            className="flex items-center gap-1 rounded-lg bg-bg-brand-solid-primary px-3 py-1.5 text-label-xs font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
            onClick={onConfirm}
            disabled={disabled}
          >
            <Check size={13} aria-hidden="true" />
            Save it
          </button>
          <button
            type="button"
            className="flex items-center gap-1 rounded-lg border border-border-gray-secondary px-3 py-1.5 text-label-xs font-semibold text-text-gray-primary transition hover:bg-bg-gray-soft-primary disabled:opacity-50"
            onClick={onChange}
            disabled={disabled}
          >
            <PencilLine size={13} aria-hidden="true" />
            Change something
          </button>
        </div>
      )}
    </section>
  );
}
