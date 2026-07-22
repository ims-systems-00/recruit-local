'use client';

import DraftEditor from '@/components/draft-editor/draft-editor';

import { set, unset } from 'sanity';

type Props = {
  value?: string;
  onChange: (value: any) => void;
};

export default function SanityDraftEditor({ value, onChange }: Props) {
  return (
    <DraftEditor
      value={value}
      onChange={(_, json) => {
        if (!json) {
          onChange(unset());
          return;
        }

        onChange(set(json));
      }}
    />
  );
}
