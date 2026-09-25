import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Forget Password',
};

export default function ForgetPasswordLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
