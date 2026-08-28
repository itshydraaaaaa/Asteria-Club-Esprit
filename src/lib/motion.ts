/**
 * Asteria Motion System — Fluid, water-inspired
 * Source of truth: Asteria — Charte graphique 2026 · v2.1
 */

export const MOTION_EASINGS = {
  vague: [0.16, 1, 0.3, 1],     // Entrances (modals, cards appearing, page transitions in)
  courant: [0.65, 0, 0.35, 1],   // Transitions (tab switches, state changes, hover states)
  maree: [0.37, 0, 0.63, 1],     // Exits (modals closing, items being removed/dismissed)
} as const;

export const MOTION_DURATIONS = {
  fast: 0.15,      // 150ms
  standard: 0.3,   // 300ms
  slow: 0.5,       // 500ms
  ambient: 3.2,    // 3200ms
} as const;

export const fadeInUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: MOTION_EASINGS.vague } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2, ease: MOTION_EASINGS.maree } },
};

export const modalVariants = {
  initial: { opacity: 0, scale: 0.96, y: 10 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3, ease: MOTION_EASINGS.vague } },
  exit: { opacity: 0, scale: 0.96, y: 10, transition: { duration: 0.2, ease: MOTION_EASINGS.maree } },
};
