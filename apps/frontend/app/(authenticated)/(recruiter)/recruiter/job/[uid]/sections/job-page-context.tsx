'use client';

import { usePageContext } from '@/components/ai-chat/page-context';

/**
 * Tells Alice which job this page is about.
 *
 * Without it she has no jobId, and a request like "add a shortlisted stage"
 * makes her pick a job from list_jobs on her own. That failure is invisible from
 * the outside: every board has a "New Applicants" and an "Interview", so an
 * answer about the wrong job has plausible stages and plausible numbers, and the
 * recruiter reading it has no way to tell it is not their board.
 *
 * Rendered by the page itself rather than by one tab, so the job is known on
 * every tab. The applicants tab registers a more specific context on top of this
 * one while it is open — the most recently registered context wins.
 *
 * A component rather than a hook call in the page because the page is a server
 * component and this has to run in the browser.
 */

/** Job titles have no length limit on the server; the page summary is capped at 300. */
const TITLE_CHARS = 80;

export default function JobPageContext({
  jobId,
  jobTitle,
  reference,
}: {
  jobId: string;
  jobTitle?: string;
  reference?: string;
}) {
  const shortTitle = jobTitle?.slice(0, TITLE_CHARS);

  usePageContext({
    page: 'recruiter.job',
    summary:
      `The recruiter is looking at their own job "${shortTitle ?? 'untitled'}"` +
      `${reference ? ` (${reference})` : ''}. ` +
      'Any question about this job, its applicants or its pipeline is about this job and no other.',
    state: {
      jobId,
      jobTitle: shortTitle ?? null,
      reference: reference ?? null,
    },
  });

  return null;
}
