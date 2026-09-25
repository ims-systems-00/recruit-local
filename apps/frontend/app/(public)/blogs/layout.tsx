import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blogs',
};

export default function BlogsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
