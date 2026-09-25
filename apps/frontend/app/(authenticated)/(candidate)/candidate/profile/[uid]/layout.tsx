import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Candidate Profile',
};

export default function CandidateProfileLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
