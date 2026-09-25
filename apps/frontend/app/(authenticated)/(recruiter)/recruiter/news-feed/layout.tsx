import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'News Feed',
};

export default function RecruiterNewsFeedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
