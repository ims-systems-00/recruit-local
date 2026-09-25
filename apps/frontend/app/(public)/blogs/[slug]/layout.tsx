import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog Details',
};

export default function BlogDetailsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
