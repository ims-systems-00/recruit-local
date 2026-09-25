import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Verify Email',
};

export default function VerifyEmailLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
