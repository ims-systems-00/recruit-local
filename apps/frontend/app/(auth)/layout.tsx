import AuthenticationLayout from '@/components/layouts/authentication-layout';

export default function AuthenticationLayoutRoute({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthenticationLayout>
      <main>{children}</main>
    </AuthenticationLayout>
  );
}
