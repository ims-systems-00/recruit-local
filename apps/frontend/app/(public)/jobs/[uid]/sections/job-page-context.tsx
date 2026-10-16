'use client';

import { usePageContext } from '@/components/ai-chat/page-context';

/**
 * Tells Alice which job this page is about.
 *
 * Her intro here offers to check how well the viewer fits "this role". Without
 * the jobId she cannot: she would have to guess the job from a search, and a
 * fit report for the wrong job reads just as plausibly as one for the right job.
 *
 * A component rather than a hook call in the page because the page is a server
 * component and this has to run in the browser.
 */

/** Job titles have no length limit on the server; the page summary is capped at 300. */
const TITLE_CHARS = 80;

export default function JobPageContext({
  jobId,
  jobTitle,
}: {
  jobId: string;
  jobTitle?: string;
}) {
  const shortTitle = jobTitle?.slice(0, TITLE_CHARS);

  usePageContext({
    page: 'public.job',
    summary:
      `The user is reading the job post "${shortTitle ?? 'untitled'}". ` +
      'Any question about "this job" or "this role" is about this job and no other.',
    state: {
      jobId,
      jobTitle: shortTitle ?? null,
    },
  });

  return null;
}
