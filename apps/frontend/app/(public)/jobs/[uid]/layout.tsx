import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Job Details',
};

export default function JobDetailsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
