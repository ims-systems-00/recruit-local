/**
 * App-wide motion primitives.
 *
 * The marketing pages have their own variants in
 * `app/(public)/sections/section-motion.ts`. This module is for the product UI;
 * it reuses the same easing curve so the two read as one system.
 */

/** The house easing curve, shared with the marketing variants. */
export const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * Enter/exit for a chip in a wrapping list. Spread onto a `motion` element that
 * sits inside an `<AnimatePresence>`; pair it with `layout` so the chips left
 * behind slide over rather than jumping.
 */
export const chipMotion = {
  initial: { opacity: 0, scale: 0.85, y: 4 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.85, y: -4 },
  transition: { duration: 0.22, ease: easeOut },
};

/**
 * Gap between each value when Alice fills a step. Long enough to read as one
 * value landing after another, short enough that a full selection still
 * completes in well under a second.
 */
export const AGENT_STAGGER_MS = 120;

/**
 * True when the viewer has asked for less motion. Read at call time rather than
 * through a hook, so it can gate imperative sequences.
 */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));
