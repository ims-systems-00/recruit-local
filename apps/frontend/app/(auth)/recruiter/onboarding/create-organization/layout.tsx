import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Organization',
};

export default function CreateOrganizationLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
