import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Article Details',
};

export default function CandidateArticleDetailsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
