import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Discover Jobs',
};

export default function DiscoverJobsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
