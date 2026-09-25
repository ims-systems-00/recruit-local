import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Candidate Jobs',
};

export default function CandidateJobsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
