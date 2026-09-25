import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Candidate Values',
};

export default function CandidateValuesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
