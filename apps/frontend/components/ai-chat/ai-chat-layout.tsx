'use client';
import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import AiChatButton from './ai-chat-button';
import AiChatModal from './ai-chat-modal';
import AliceIntroBubble from './alice-intro-bubble';
import { findPageIntro, introViewerOf } from './page-intros';

/**
 * Closing unmounts the chat, so the next open starts fresh. Minimizing only
 * hides it, so the next open picks up the same conversation where it was.
 */
type ChatState = 'closed' | 'open' | 'minimized';

/** Lets the page settle before Alice speaks up. */
const INTRO_DELAY_MS = 3000;

export default function AiChatLayout() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [chatState, setChatState] = useState<ChatState>('closed');
  /** The intro on screen, by page id; null when none is. */
  const [shownIntroId, setShownIntroId] = useState<string | null>(null);
  const introTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  const intro = findPageIntro(pathname);
  const introId = intro?.id;

  // Nothing is remembered, so she speaks up on every visit to a page that has
  // an intro. Leaving the page takes its intro with it.
  useEffect(() => {
    if (!introId) return;

    introTimer.current = setTimeout(
      () => setShownIntroId(introId),
      INTRO_DELAY_MS,
    );
    return () => {
      clearTimeout(introTimer.current);
      setShownIntroId(null);
    };
  }, [introId]);

  // Also cancels a pending intro, so one dismissed early never appears later.
  const dismissIntro = () => {
    clearTimeout(introTimer.current);
    setShownIntroId(null);
  };

  // Opening the chat, from the card or the launcher, counts as meeting her.
  const openChat = () => {
    dismissIntro();
    setChatState('open');
  };

  const introOpen =
    !!intro && shownIntroId === intro.id && chatState === 'closed';
  const viewer = introViewerOf(status, session);

  return (
    <div>
      <AiChatButton setIsOpen={openChat} attention={introOpen} />
      <AliceIntroBubble
        open={introOpen}
        message={intro?.message[viewer] ?? ''}
        cta={viewer === 'visitor' ? 'See what I can do' : 'Chat with me'}
        onOpenChat={openChat}
        onDismiss={dismissIntro}
      />
      {chatState !== 'closed' && (
        <AiChatModal
          hidden={chatState === 'minimized'}
          // Signed-out viewers get the sign-in pitch instead.
          pageMessage={
            viewer === 'visitor' ? undefined : intro?.message[viewer]
          }
          onClose={() => setChatState('closed')}
          onMinimize={() => setChatState('minimized')}
        />
      )}
    </div>
  );
}
