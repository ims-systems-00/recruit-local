import { clsx, type ClassValue } from 'clsx';
import moment from 'moment';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * Design-system typography presets (`text-label-sm`, `text-body-md`, etc.) share the
 * `text-*` prefix with color utilities (`text-text-brand-secondary`). Without a separate
 * merge group, tailwind-merge treats them as conflicting and drops the typography class.
 */
const typographyTextPresets = [
  'display-sm',
  'display-lg',
  'heading-2xl',
  'heading-xl',
  'heading-lg',
  'heading-md',
  'heading-sm',
  'body-xl',
  'body-lg',
  'body-md',
  'body-sm',
  'body-xs',
  'label-xl',
  'label-lg',
  'label-md',
  'label-sm',
  'label-xs',
] as const;

const twMerge = extendTailwindMerge<'typography-preset'>({
  extend: {
    classGroups: {
      'typography-preset': [{ text: [...typographyTextPresets] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatDate = (date?: string | Date) => {
  if (!date) return 'N/A';

  return moment(date).format('MMM DD, YYYY');
};
