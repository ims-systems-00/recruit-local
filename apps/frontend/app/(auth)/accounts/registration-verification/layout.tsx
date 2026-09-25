import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Registration Verification',
};

export default function RegistrationVerificationLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
