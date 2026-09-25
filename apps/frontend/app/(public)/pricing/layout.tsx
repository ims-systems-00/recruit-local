import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing',
};

export default function PricingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
