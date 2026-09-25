import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Discover Job Details',
};

export default function DiscoverJobDetailsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
