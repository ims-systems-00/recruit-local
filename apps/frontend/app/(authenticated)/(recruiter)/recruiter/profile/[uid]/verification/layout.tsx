import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Profile Verification',
};

export default function ProfileVerificationLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
