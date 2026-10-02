import { ACCOUNT_TYPE_ENUMS } from '@rl/types';
import type { Session } from 'next-auth';

/**
 * What Alice says when a page opens, one entry per page that has something
 * worth saying. A page with no entry gets no intro.
 *
 * Only promise what she can do for that viewer: nobody can chat with her until
 * signed in, and recommending jobs or checking fit needs a candidate profile.
 *
 * For someone signed in, the same message also opens the chat, after
 * "Hi, I'm Alice!" — so write it to read well in both places.
 */

/** Who the intro is for: signed out, a candidate, or anyone else signed in. */
export type IntroViewer = 'visitor' | 'candidate' | 'other';

export interface PageIntro {
  /** Stable id. A new id means a new page, so the intro starts over. */
  id: string;
  match: (pathname: string) => boolean;
  message: Record<IntroViewer, string>;
}

const LANDING_SIGNED_IN =
  'I help jobseekers and employers find the right match, close to home. What can I do for you?';

export const PAGE_INTROS: PageIntro[] = [
  {
    id: 'landing',
    match: (pathname) => pathname === '/',
    message: {
      visitor:
        "Recruit Local's AI assistant. I help jobseekers and employers find the right match, close to home.",
      candidate: LANDING_SIGNED_IN,
      other: LANDING_SIGNED_IN,
    },
  },
  {
    id: 'jobs',
    match: (pathname) => pathname === '/jobs',
    message: {
      visitor:
        "Browsing jobs? Sign in and I'll recommend the ones that best fit your skills and values.",
      candidate:
        "Browsing jobs? Ask me and I'll pick out the ones that best fit your profile and values.",
      other:
        'Ask me anything about how jobs and matching work on Recruit Local.',
    },
  },
  {
    // Fit checks need the job: the page reports it to her (`public.job`).
    id: 'job-detail',
    match: (pathname) => /^\/jobs\/[^/]+$/.test(pathname),
    message: {
      visitor:
        "Interested in this role? Sign in and I'll tell you how well it fits your skills and values.",
      candidate:
        'Want to know how well you fit this role? I can check it against your profile.',
      other:
        'Ask me anything about how jobs and matching work on Recruit Local.',
    },
  },
];

export const findPageIntro = (pathname: string) =>
  PAGE_INTROS.find((intro) => intro.match(pathname));

export const introViewerOf = (
  status: 'authenticated' | 'loading' | 'unauthenticated',
  session: Session | null,
): IntroViewer => {
  if (status !== 'authenticated') return 'visitor';
  return session?.user?.type === ACCOUNT_TYPE_ENUMS.CANDIDATE
    ? 'candidate'
    : 'other';
};
