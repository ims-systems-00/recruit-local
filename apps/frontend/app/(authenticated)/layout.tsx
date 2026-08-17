import AiChatLayout from '@/components/ai-chat/ai-chat-layout';
import AuthLayout from '@/components/layouts/auth-layout';

export default function AuthenticatedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthLayout>
      {children}
      <AiChatLayout />
    </AuthLayout>
  );
}
