import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Recruiter Role',
};

export default function RecruiterRoleLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
