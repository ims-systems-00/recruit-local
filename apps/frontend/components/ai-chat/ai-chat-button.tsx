import { Bot } from 'lucide-react';
import React from 'react';

export default function AiChatButton({
  setIsOpen,
}: {
  setIsOpen: (isOpen: boolean) => void;
}) {
  return (
    <button
      className=" fixed bottom-spacing-xl right-spacing-xl"
      onClick={() => setIsOpen(true)}
      aria-label="Open Alice chat"
    >
      <div
        className=" w-12 h-12 rounded-full bg-bg-gray-soft-primary flex items-center justify-center cursor-pointer border border-border-gray-primary "
        aria-hidden="true"
      >
        <Bot size={24} strokeWidth={1.8} className="text-text-brand-primary" />
      </div>
    </button>
  );
}
