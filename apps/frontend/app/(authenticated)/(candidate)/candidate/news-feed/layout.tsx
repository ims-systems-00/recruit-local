import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'News Feed',
};

export default function CandidateNewsFeedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
