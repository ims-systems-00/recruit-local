import AuthenticationLayout from '@/components/layouts/authentication-layout';
import AiChatLayout from '@/components/ai-chat/ai-chat-layout';

export default function AuthenticationLayoutRoute({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthenticationLayout>
      <main>
        {children}
        <AiChatLayout />
      </main>
    </AuthenticationLayout>
  );
}
