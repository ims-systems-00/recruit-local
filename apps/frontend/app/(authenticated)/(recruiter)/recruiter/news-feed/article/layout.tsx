import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Article',
};

export default function CreateArticleLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
