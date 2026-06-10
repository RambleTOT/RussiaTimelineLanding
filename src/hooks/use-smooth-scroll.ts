import { useEffect } from 'react';
import Lenis from 'lenis';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { setLenisInstance } from '@/lib/smooth-scroll';
import { useReducedMotion } from './use-reduced-motion';

/**
 * Initialise Lenis smooth scrolling and wire it to the GSAP ticker so
 * ScrollTrigger stays in sync. Disabled entirely under prefers-reduced-motion
 * (native scrolling takes over, and scrollToTarget falls back gracefully).
 */
export function useSmoothScroll(): void {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      setLenisInstance(null);
      return;
    }

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
    });
    setLenisInstance(lenis);

    const onScroll = () => ScrollTrigger.update();
    lenis.on('scroll', onScroll);

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.off('scroll', onScroll);
      gsap.ticker.remove(raf);
      lenis.destroy();
      setLenisInstance(null);
    };
  }, [reducedMotion]);
}
