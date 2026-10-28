import Image from 'next/image';
import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { easeOut } from '@/lib/motion';
import aiBot from '@/public/images/alice_icon.svg';

/** A quick hop and head-tilt, as if she has just spoken up. */
const headVariants = {
  rest: { scale: 1, rotate: 0 },
  hop: {
    scale: [1, 1.18, 0.92, 1.06, 1],
    rotate: [0, -14, 12, -6, 0],
    transition: { duration: 0.7, ease: easeOut },
  },
};

export default function AiChatButton({
  setIsOpen,
  attention = false,
}: {
  setIsOpen: (isOpen: boolean) => void;
  /** She is introducing herself: hop and pulse. */
  attention?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const animate = attention && !reduceMotion;

  return (
    <button
      className=" fixed bottom-spacing-xl right-spacing-xl"
      onClick={() => setIsOpen(true)}
      aria-label="Open Alice chat"
    >
      <motion.div
        className="relative w-12 h-12 rounded-full bg-bg-gray-solid-secondary flex items-center shadow-md justify-center cursor-pointer"
        aria-hidden="true"
        variants={headVariants}
        initial={false}
        animate={animate ? 'hop' : 'rest'}
      >
        {animate && (
          <motion.span
            className="absolute inset-0 rounded-full border-2 border-border-brand-primary pointer-events-none"
            initial={{ scale: 1, opacity: 0.6 }}
            animate={{ scale: 1.9, opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut', repeat: 2 }}
          />
        )}
        <Image
          className=" max-w-6 max-h-6"
          src={aiBot}
          width={24}
          height={24}
          alt="AI Bot"
        />
      </motion.div>
    </button>
  );
}
