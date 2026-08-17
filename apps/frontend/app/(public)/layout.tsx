import PublicLayout from '@/components/layouts/public-layout';
import AiChatLayout from '@/components/ai-chat/ai-chat-layout';

export default function PublicLayoutRoute({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <PublicLayout>
      <main>
        {children}
        <AiChatLayout />
      </main>
    </PublicLayout>
  );
}
