import { Bot } from 'lucide-react';
import Image from 'next/image';
import React from 'react';
import aiBot from '@/public/images/alice_icon.svg';

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
        className=" w-12 h-12 rounded-full bg-bg-gray-solid-secondary flex items-center shadow-md justify-center cursor-pointer"
        aria-hidden="true"
      >
        <Image
          className=" max-w-6 max-h-6"
          src={aiBot}
          width={24}
          height={24}
          alt="AI Bot"
        />
      </div>
    </button>
  );
}
