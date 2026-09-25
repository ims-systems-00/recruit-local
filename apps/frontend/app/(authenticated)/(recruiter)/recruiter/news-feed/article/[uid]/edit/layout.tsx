import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Edit Article',
};

export default function EditArticleLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
