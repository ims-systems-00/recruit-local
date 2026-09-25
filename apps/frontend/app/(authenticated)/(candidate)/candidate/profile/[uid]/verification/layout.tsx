import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Profile Verification',
};

export default function CandidateProfileVerificationLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
