import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Job Details',
};

export default function RecruiterJobDetailsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
