'use client';
import React, { useState } from 'react';
import AiChatButton from './ai-chat-button';
import AiChatModal from './ai-chat-modal';

/**
 * Closing unmounts the chat, so the next open starts fresh. Minimizing only
 * hides it, so the next open picks up the same conversation where it was.
 */
type ChatState = 'closed' | 'open' | 'minimized';

export default function AiChatLayout() {
  const [chatState, setChatState] = useState<ChatState>('closed');
  return (
    <div>
      <AiChatButton setIsOpen={() => setChatState('open')} />
      {chatState !== 'closed' && (
        <AiChatModal
          hidden={chatState === 'minimized'}
          onClose={() => setChatState('closed')}
          onMinimize={() => setChatState('minimized')}
        />
      )}
    </div>
  );
}
