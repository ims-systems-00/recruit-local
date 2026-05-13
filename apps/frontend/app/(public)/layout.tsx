import PublicLayout from '@/components/layouts/public-layout';

export default function PublicLayoutRoute({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <PublicLayout>{children}</PublicLayout>;
}
