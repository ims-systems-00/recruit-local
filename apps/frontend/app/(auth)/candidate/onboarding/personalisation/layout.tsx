import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Candidate Personalisation',
};

export default function CandidatePersonalisationLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
