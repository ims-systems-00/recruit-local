'use client';
import React, { useState } from 'react';
import AiChatButton from './ai-chat-button';
import AiChatModal from './ai-chat-modal';

export default function AiChatLayout() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div>
      <AiChatButton setIsOpen={setIsOpen} />
      {isOpen && <AiChatModal setIsOpen={setIsOpen} />}
    </div>
  );
}
