'use client';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, X } from 'lucide-react';
import { easeOut } from '@/lib/motion';

/** How long Alice is shown typing before her message lands. */
const TYPING_MS = 1100;

/**
 * Bubbles sit beside the launcher, 12px from it. Scaling from the launcher's
 * centre — 12px gap plus half its 48px width to the right, half its height up
 * from the bottom — is what makes them grow out of, and shrink back into, her
 * logo.
 */
const FROM_HEAD = { transformOrigin: 'calc(100% + 36px) calc(100% - 24px)' };

const popSpring = {
  type: 'spring',
  stiffness: 420,
  damping: 26,
  mass: 0.8,
} as const;

const contentStagger = {
  hidden: {},
  visible: { transition: { delayChildren: 0.12, staggerChildren: 0.07 } },
};

const contentLine = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: easeOut } },
};

interface IntroContent {
  /** Her opening line, before the wave. */
  heading?: string;
  /** What she says about this page — see `page-intros.ts`. */
  message: string;
  /** The link line under it. */
  cta: string;
  onOpenChat: () => void;
  onDismiss: () => void;
}

/**
 * Alice's opening line on a page, styled as a chat head: the launcher is her
 * head, and her message pops out beside it. It never opens the chat by itself
 * — on phones the chat covers the whole page — so the visitor chooses whether
 * to meet her.
 *
 * The live region stays mounted while the bubble comes and goes, because screen
 * readers announce changes to a region, not a region that arrives already full.
 */
export default function AliceIntroBubble({
  open,
  ...content
}: IntroContent & { open: boolean }) {
  return (
    // Anchored at the launcher's bottom-right corner, so bubbles line up with it.
    <div
      className="fixed right-spacing-xl bottom-spacing-xl z-30"
      role="status"
    >
      <AnimatePresence>
        {open && <IntroSequence key="intro" {...content} />}
      </AnimatePresence>
    </div>
  );
}

/** Typing dots, then the message. Mounted fresh each time the intro opens. */
function IntroSequence({
  heading = "Hi, I'm Alice",
  message,
  cta,
  onOpenChat,
  onDismiss,
}: IntroContent) {
  const reduceMotion = useReducedMotion();
  const [typing, setTyping] = useState(!reduceMotion);

  useEffect(() => {
    if (!typing) return;
    const timer = setTimeout(() => setTyping(false), TYPING_MS);
    return () => clearTimeout(timer);
  }, [typing]);

  const popIn = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 } }
    : {
        initial: { opacity: 0, scale: 0.2 },
        animate: { opacity: 1, scale: 1 },
      };

  return (
    // Owns the exit for the whole sequence: whichever bubble is showing
    // shrinks back into her head.
    <motion.div
      className="absolute right-[60px] bottom-0"
      style={FROM_HEAD}
      exit={
        reduceMotion
          ? { opacity: 0, transition: { duration: 0.15 } }
          : {
              opacity: 0,
              scale: 0.2,
              transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
            }
      }
    >
      <AnimatePresence mode="wait">
        {typing ? (
          <motion.div
            key="typing"
            className="relative flex items-center gap-[5px] px-4 py-3 bg-white border border-border-gray-secondary rounded-2xl shadow-[0_10px_30px_rgba(28,42,61,0.18)]"
            style={FROM_HEAD}
            {...popIn}
            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.12 } }}
            transition={{
              ...popSpring,
              delay: 0.25,
              opacity: { duration: 0.15, delay: 0.25 },
            }}
            aria-hidden="true"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#9aa5b6] animate-bounce" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#9aa5b6] animate-bounce [animation-delay:200ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#9aa5b6] animate-bounce [animation-delay:400ms]" />
            <BubbleTail />
          </motion.div>
        ) : (
          <motion.div
            key="message"
            className="relative w-[min(280px,calc(100vw-96px))] bg-white border border-border-gray-secondary rounded-2xl shadow-[0_18px_50px_rgba(28,42,61,0.22)] transition-shadow hover:shadow-[0_22px_56px_rgba(28,42,61,0.28)]"
            style={FROM_HEAD}
            {...popIn}
            transition={{ ...popSpring, opacity: { duration: 0.15 } }}
          >
            <button
              type="button"
              className="w-full p-spacing-md pr-10 text-left rounded-2xl"
              onClick={onOpenChat}
            >
              <motion.span
                className="block"
                variants={contentStagger}
                initial={reduceMotion ? false : 'hidden'}
                animate="visible"
              >
                <motion.span
                  className="block text-label-sm font-label-sm-strong! text-text-gray-primary"
                  variants={contentLine}
                >
                  {heading}{' '}
                  <motion.span
                    className="inline-block origin-[70%_70%]"
                    animate={
                      reduceMotion
                        ? undefined
                        : { rotate: [0, 16, -8, 16, -4, 10, 0] }
                    }
                    transition={{
                      duration: 1.2,
                      delay: 0.35,
                      ease: 'easeInOut',
                    }}
                  >
                    👋
                  </motion.span>
                </motion.span>
                <motion.span
                  className="block mt-1 text-label-xs text-text-gray-secondary"
                  variants={contentLine}
                >
                  {message}
                </motion.span>
                <motion.span
                  className="flex items-center gap-1 mt-2 text-label-xs font-label-xs-strong! text-text-brand-primary"
                  variants={contentLine}
                >
                  {cta}
                  <ArrowRight size={13} aria-hidden="true" />
                </motion.span>
              </motion.span>
            </button>
            <button
              type="button"
              className="absolute top-2 right-2 w-7 h-7 grid place-items-center text-fg-gray-secondary rounded-full transition hover:bg-[#edf0f4]"
              onClick={onDismiss}
              aria-label="Dismiss Alice's introduction"
            >
              <X size={14} />
            </button>
            <BubbleTail />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/** Points at her head, level with its centre. */
function BubbleTail() {
  return (
    <span
      className="absolute -right-[6px] bottom-[19px] w-2.5 h-2.5 rotate-45 bg-white border-t border-r border-border-gray-secondary"
      aria-hidden="true"
    />
  );
}
