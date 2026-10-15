'use client';
import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import AiChatButton from './ai-chat-button';
import AiChatModal from './ai-chat-modal';
import AliceIntroBubble from './alice-intro-bubble';
import {
  findPageIntro,
  introDue,
  introViewerOf,
  LOGIN_WELCOME,
  markIntroSeen,
  quietAlice,
  takeLoginWelcome,
} from './page-intros';

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
  /** The first page after login, welcomed in place of its intro until left. */
  const [welcomePath, setWelcomePath] = useState<string | null>(null);
  const introTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  // Waits for the session, so the login mark is read only once she knows
  // who she is welcoming.
  useEffect(() => {
    if (status !== 'authenticated') return;
    const welcome = takeLoginWelcome(pathname);
    if (welcome !== undefined) setWelcomePath(welcome ? pathname : null);
  }, [pathname, status]);

  const viewer = introViewerOf(status, session);
  const pageIntro = findPageIntro(pathname, viewer, session);
  const welcome = welcomePath === pathname && viewer !== 'visitor';
  const introId = welcome ? LOGIN_WELCOME.id : pageIntro?.id;
  const introMessage = welcome
    ? LOGIN_WELCOME.message[viewer]
    : pageIntro?.message[viewer];

  // Each intro pops up once per session, and none after she has been met; the
  // welcome is once per login already. Leaving the page takes its intro with it.
  useEffect(() => {
    if (!introId) return;
    if (introId !== LOGIN_WELCOME.id && !introDue(introId)) return;

    introTimer.current = setTimeout(() => {
      markIntroSeen(introId);
      setShownIntroId(introId);
    }, INTRO_DELAY_MS);
    return () => {
      clearTimeout(introTimer.current);
      setShownIntroId(null);
    };
  }, [introId]);

  // Also cancels a pending intro, so one dismissed early never appears later.
  // Dismissing counts as meeting her, so she stays quiet for the session.
  const dismissIntro = () => {
    clearTimeout(introTimer.current);
    setShownIntroId(null);
    quietAlice();
  };

  // Opening the chat, from the card or the launcher, counts as meeting her.
  const openChat = () => {
    dismissIntro();
    setChatState('open');
  };

  const introOpen =
    !!introId && shownIntroId === introId && chatState === 'closed';

  return (
    <div>
      <AiChatButton setIsOpen={openChat} attention={introOpen} />
      <AliceIntroBubble
        open={introOpen}
        heading={
          welcome ? LOGIN_WELCOME.heading(session?.user?.firstName) : undefined
        }
        message={introMessage ?? ''}
        cta={viewer === 'visitor' ? 'See what I can do' : 'Chat with me'}
        onOpenChat={openChat}
        onDismiss={dismissIntro}
      />
      {chatState !== 'closed' && (
        <AiChatModal
          hidden={chatState === 'minimized'}
          // Signed-out viewers get the sign-in pitch instead.
          pageMessage={viewer === 'visitor' ? undefined : introMessage}
          onClose={() => setChatState('closed')}
          onMinimize={() => setChatState('minimized')}
        />
      )}
    </div>
  );
}
