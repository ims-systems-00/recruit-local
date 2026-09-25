import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Logout',
};

export default function LogoutLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
