import type Lenis from 'lenis';

/**
 * Module-level holder for the single Lenis instance so any component can
 * trigger a smooth scroll (deep links, hero buttons, scroll-to-top) without
 * prop-drilling or context. Falls back to native scrolling when Lenis is off
 * (e.g. prefers-reduced-motion).
 */
let instance: Lenis | null = null;

export function setLenisInstance(l: Lenis | null): void {
  instance = l;
}

interface ScrollOptions {
  offset?: number;
  immediate?: boolean;
}

export function scrollToTarget(
  target: string | HTMLElement | number,
  { offset = 0, immediate = false }: ScrollOptions = {},
): void {
  if (instance) {
    instance.scrollTo(target, { offset, immediate, duration: immediate ? 0 : 1.1 });
    return;
  }

  // Native fallback
  if (typeof target === 'number') {
    window.scrollTo({ top: target + offset, behavior: immediate ? 'auto' : 'smooth' });
    return;
  }
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (el instanceof HTMLElement) {
    const top = el.getBoundingClientRect().top + window.scrollY + offset;
    window.scrollTo({ top, behavior: immediate ? 'auto' : 'smooth' });
  }
}
