import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Apply Job',
};

export default function ApplyJobLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
