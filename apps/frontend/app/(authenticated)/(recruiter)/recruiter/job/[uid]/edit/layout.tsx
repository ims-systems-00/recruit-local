import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Edit Job',
};

export default function EditJobLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
