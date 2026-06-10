import { useMediaQuery } from './use-media-query';

/** True when the user prefers reduced motion. */
export function useReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}
