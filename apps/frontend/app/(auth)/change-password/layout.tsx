import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Change Password',
};

export default function ChangePasswordLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
