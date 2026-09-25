import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Recruiter Values',
};

export default function RecruiterValuesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
