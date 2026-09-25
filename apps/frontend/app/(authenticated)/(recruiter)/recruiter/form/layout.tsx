import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Recruiter Form',
};

export default function RecruiterFormLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
