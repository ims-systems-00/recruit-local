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

/**
 * Her welcome on the first page after login, in place of that page's intro.
 * Only someone who has just signed in sees it, so there is no visitor line.
 */
export const LOGIN_WELCOME = {
  id: 'welcome',
  heading: (firstName?: string) =>
    firstName ? `Welcome back, ${firstName}` : 'Welcome back',
  message: {
    candidate:
      'Good to see you again. Want me to find jobs that fit you, or check how a role matches your profile?',
    other: 'Good to see you again. What can I help you with today?',
  },
} as const;

/** Login passes through these on its way to the user's first page. */
const LOGIN_TRANSIT_PATHS = new Set(['/login', '/system-preparation']);

/** Still setting up, where "welcome back" reads oddly: the welcome is dropped. */
const isSetupPath = (pathname: string) =>
  pathname.startsWith('/accounts/') ||
  /^\/(candidate|recruiter)\/onboarding(\/|$)/.test(pathname);

/** Set at login, read by the first page after it. Per tab, so per login. */
const LOGIN_WELCOME_KEY = 'rl:alice-welcome';

// Storage can be blocked (private windows, site data off); she then just
// skips the welcome.

export const markLoginWelcome = () => {
  try {
    sessionStorage.setItem(LOGIN_WELCOME_KEY, '1');
  } catch {
    // Skipped, see above.
  }
};

/**
 * The page this login's welcome went to. Asking again from that page gets the
 * same answer: React runs effects twice in dev (Strict Mode), and the second
 * run finds the mark already cleared.
 */
let welcomedPath: string | null = null;

/**
 * Whether `pathname` is the first page after login and should be welcomed.
 * Clears the mark on that page either way, so she welcomes once per login.
 * Returns undefined while the login is still in transit.
 */
export const takeLoginWelcome = (pathname: string): boolean | undefined => {
  if (LOGIN_TRANSIT_PATHS.has(pathname)) return undefined;
  try {
    if (sessionStorage.getItem(LOGIN_WELCOME_KEY) !== null) {
      sessionStorage.removeItem(LOGIN_WELCOME_KEY);
      welcomedPath = isSetupPath(pathname) ? null : pathname;
    }
  } catch {
    // Skipped, see above.
  }
  // Once she has left that page, the welcome is over.
  if (welcomedPath !== pathname) welcomedPath = null;
  return welcomedPath === pathname;
};

export const introViewerOf = (
  status: 'authenticated' | 'loading' | 'unauthenticated',
  session: Session | null,
): IntroViewer => {
  if (status !== 'authenticated') return 'visitor';
  return session?.user?.type === ACCOUNT_TYPE_ENUMS.CANDIDATE
    ? 'candidate'
    : 'other';
};
