import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Recruiter Profile',
};

export default function RecruiterProfileLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
