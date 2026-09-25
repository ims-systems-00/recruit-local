import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Applicant Details',
};

export default function ApplicantDetailsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
