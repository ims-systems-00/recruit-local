'use client';
import { useId } from 'react';
import { Switch } from '@/components/ui/switch';
import {
  useAccessibilityPreferences,
  useUpdateAccessibilityPreferences,
} from '@/services/agent/agent.client';
import {
  ANSWER_LENGTH,
  type AccessibilityPreferencesInput,
} from '@/services/agent/agent.type';

const SPEECH_RATES = [0.75, 1, 1.25, 1.5];

const ANSWER_LENGTH_LABELS: Record<ANSWER_LENGTH, string> = {
  [ANSWER_LENGTH.BRIEF]: 'Brief',
  [ANSWER_LENGTH.NORMAL]: 'Normal',
  [ANSWER_LENGTH.DETAILED]: 'Detailed',
};

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <div>
        <label
          htmlFor={id}
          className="block text-label-sm font-semibold text-text-gray-primary"
        >
          {label}
        </label>
        <p
          id={`${id}-desc`}
          className="text-label-xs text-text-gray-quaternary"
        >
          {description}
        </p>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        aria-describedby={`${id}-desc`}
      />
    </div>
  );
}

/**
 * How Alice communicates with this user. The same settings Alice records when
 * asked in chat ("keep it simple"), so changing one here and saying it there
 * land in the same place.
 */
export default function AiChatSettings() {
  const { preferences, isLoading } = useAccessibilityPreferences();
  const { updatePreferences } = useUpdateAccessibilityPreferences();
  const lengthId = useId();
  const rateId = useId();

  if (isLoading || !preferences) {
    return (
      <p
        className="px-[18px] py-4 text-label-sm text-text-gray-quaternary"
        role="status"
      >
        Loading settings…
      </p>
    );
  }

  const set = (change: AccessibilityPreferencesInput) =>
    updatePreferences(change);

  return (
    <section
      className="overflow-y-auto border-b border-[#e6e8ec] px-[18px] py-3"
      aria-label="Assistant settings"
    >
      <ToggleRow
        label="Plain language"
        description="Short sentences and everyday words."
        checked={preferences.plainLanguage}
        onChange={(plainLanguage) => set({ plainLanguage })}
      />
      <ToggleRow
        label="One question at a time"
        description="Alice asks a single question per reply."
        checked={preferences.oneQuestionAtATime}
        onChange={(oneQuestionAtATime) => set({ oneQuestionAtATime })}
      />
      <ToggleRow
        label="Read replies aloud"
        description="Every reply from Alice is spoken automatically."
        checked={preferences.autoReadAloud}
        onChange={(autoReadAloud) => set({ autoReadAloud })}
      />

      <div className="flex items-center justify-between gap-3 py-2">
        <label
          htmlFor={lengthId}
          className="text-label-sm font-semibold text-text-gray-primary"
        >
          Answer length
        </label>
        <select
          id={lengthId}
          className="rounded-md border border-border-gray-secondary bg-white px-2 py-1 text-label-sm"
          value={preferences.answerLength}
          onChange={(e) =>
            set({ answerLength: e.target.value as ANSWER_LENGTH })
          }
        >
          {Object.values(ANSWER_LENGTH).map((value) => (
            <option key={value} value={value}>
              {ANSWER_LENGTH_LABELS[value]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between gap-3 py-2">
        <label
          htmlFor={rateId}
          className="text-label-sm font-semibold text-text-gray-primary"
        >
          Reading speed
        </label>
        <select
          id={rateId}
          className="rounded-md border border-border-gray-secondary bg-white px-2 py-1 text-label-sm"
          value={String(preferences.speechRate)}
          onChange={(e) => set({ speechRate: Number(e.target.value) })}
        >
          {SPEECH_RATES.map((rate) => (
            <option key={rate} value={rate}>
              {rate === 1 ? 'Normal' : `${rate}×`}
            </option>
          ))}
        </select>
      </div>

      <p className="pt-1 text-label-xs text-text-gray-quaternary">
        Settings apply from Alice&apos;s next reply.
      </p>
    </section>
  );
}
