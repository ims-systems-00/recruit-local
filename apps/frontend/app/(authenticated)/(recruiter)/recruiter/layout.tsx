import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Recruiter Dashboard',
};

export default function RecruiterDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
