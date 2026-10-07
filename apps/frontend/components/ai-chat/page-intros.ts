import { ACCOUNT_TYPE_ENUMS } from '@rl/types';
import type { Session } from 'next-auth';

/**
 * What Alice says when a page opens, one entry per page that has something
 * worth saying. A page with no entry gets no intro.
 *
 * Only promise what she can do for that viewer: nobody can chat with her until
 * signed in, and recommending jobs or checking fit needs a candidate profile.
 * Leave her out of pages where the user is mid-form or just reading.
 *
 * For someone signed in, the same message also opens the chat, after
 * "Hi, I'm Alice!" — so write it to read well in both places.
 *
 * She pops up with each intro once per tab session, and with none once the
 * user has met her — see `introDue`.
 */

/** Who the intro is for: signed out, a candidate, or anyone else signed in. */
export type IntroViewer = 'visitor' | 'candidate' | 'other';

export interface PageIntro {
  /** Stable id. A new id means a new page, so the intro starts over. */
  id: string;
  match: (pathname: string, session: Session | null) => boolean;
  /** A viewer with no line here gets no intro on this page. */
  message: Partial<Record<IntroViewer, string>>;
}

const LANDING_SIGNED_IN =
  'I help jobseekers and employers find the right match, close to home. What can I do for you?';

const JOB_FIT_CANDIDATE =
  'Want to know how well you fit this role? I can check it against your profile.';

const isEmployer = (session: Session | null) =>
  session?.user?.type === ACCOUNT_TYPE_ENUMS.EMPLOYER;

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
      candidate: JOB_FIT_CANDIDATE,
      other:
        'Ask me anything about how jobs and matching work on Recruit Local.',
    },
  },
  {
    id: 'candidate-job-feed',
    match: (pathname) => pathname === '/candidate/jobs',
    message: {
      candidate:
        'Not sure where to start? I can pick out the jobs that best fit your profile and values.',
    },
  },
  {
    id: 'candidate-job-detail',
    match: (pathname) => /^\/candidate\/job\/[^/]+$/.test(pathname),
    message: { candidate: JOB_FIT_CANDIDATE },
  },
  {
    // Their own profile only: the uid is the job profile id.
    id: 'candidate-profile',
    match: (pathname, session) =>
      !!session?.user?.jobProfileId &&
      pathname === `/candidate/profile/${session.user.jobProfileId}`,
    message: {
      candidate:
        "Want a second pair of eyes? I can review your profile and help fill in what's missing.",
    },
  },
  {
    // Moving applicants is employer-only, so admins don't get this line.
    id: 'recruiter-job',
    match: (pathname, session) =>
      isEmployer(session) && /^\/recruiter\/job\/[^/]+$/.test(pathname),
    message: {
      other:
        'I can summarise these applicants or move them between stages for you. Just ask.',
    },
  },
  {
    id: 'recruiter-jobs',
    match: (pathname, session) =>
      isEmployer(session) && pathname === '/recruiter/jobs',
    message: {
      other:
        'Ask me which of your jobs have new applicants, or for a quick summary of any of them.',
    },
  },
];

export const findPageIntro = (
  pathname: string,
  viewer: IntroViewer,
  session: Session | null,
) =>
  PAGE_INTROS.find(
    (intro) => intro.message[viewer] && intro.match(pathname, session),
  );

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

// What she remembers lives in sessionStorage: per tab, gone when it closes.
// Storage can be blocked (private windows, site data off); she then remembers
// nothing — no welcome, and intros on every visit.

const readStore = (key: string) => {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
};

/** Null removes the key. */
const writeStore = (key: string, value: string | null) => {
  try {
    if (value === null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, value);
  } catch {
    // Not remembered, see above.
  }
};

/** Intros she has popped up with this session, as comma-separated ids. */
const SEEN_INTROS_KEY = 'rl:alice-intros-seen';

/** Set once the user has met her: dismissed an intro, or opened the chat. */
const QUIET_KEY = 'rl:alice-quiet';

const seenIntros = () => readStore(SEEN_INTROS_KEY)?.split(',') ?? [];

/**
 * Whether she should still pop up with this intro. Each one shows once per
 * session, and none do after the user has met her: she is there to be found,
 * not to keep asking.
 */
export const introDue = (id: string) =>
  readStore(QUIET_KEY) === null && !seenIntros().includes(id);

export const markIntroSeen = (id: string) => {
  const seen = seenIntros();
  if (!seen.includes(id)) writeStore(SEEN_INTROS_KEY, [...seen, id].join(','));
};

/** The user has met her: no more intros this session. */
export const quietAlice = () => writeStore(QUIET_KEY, '1');

/** Login passes through these on its way to the user's first page. */
const LOGIN_TRANSIT_PATHS = new Set(['/login', '/system-preparation']);

/** Still setting up, where "welcome back" reads oddly: the welcome is dropped. */
const isSetupPath = (pathname: string) =>
  pathname.startsWith('/accounts/') ||
  /^\/(candidate|recruiter)\/onboarding(\/|$)/.test(pathname);

/** Set at login, read by the first page after it. Per tab, so per login. */
const LOGIN_WELCOME_KEY = 'rl:alice-welcome';

/**
 * Also starts her intros over: what she told a visitor was the sign-in pitch,
 * and a signed-in user has more she can offer.
 */
export const markLoginWelcome = () => {
  writeStore(LOGIN_WELCOME_KEY, '1');
  writeStore(SEEN_INTROS_KEY, null);
  writeStore(QUIET_KEY, null);
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
  if (readStore(LOGIN_WELCOME_KEY) !== null) {
    writeStore(LOGIN_WELCOME_KEY, null);
    welcomedPath = isSetupPath(pathname) ? null : pathname;
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
