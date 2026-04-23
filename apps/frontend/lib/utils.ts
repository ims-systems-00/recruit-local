import { clsx, type ClassValue } from 'clsx';
import moment from 'moment';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatDate = (date?: string | Date) => {
  if (!date) return 'N/A';

  return moment(date).format('MMM DD, YYYY');
};
