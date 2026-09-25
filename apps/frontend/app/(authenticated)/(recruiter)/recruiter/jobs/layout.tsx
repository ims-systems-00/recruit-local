import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Recruiter Jobs',
};

export default function RecruiterJobsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
