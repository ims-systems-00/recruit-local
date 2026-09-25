import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'System Preparation',
};

export default function SystemPreparationLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
