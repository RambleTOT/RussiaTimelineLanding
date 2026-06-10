import { useEffect, useRef, type RefObject } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

interface TimelineProgressLineProps {
  containerRef: RefObject<HTMLElement>;
}

/**
 * The vertical spine that «fills» as the user scrolls through the timeline,
 * driven by a scrubbed GSAP ScrollTrigger. Under reduced-motion the line is
 * simply shown fully.
 */
export function TimelineProgressLine({ containerRef }: TimelineProgressLineProps) {
  const fillRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const container = containerRef.current;
    const fill = fillRef.current;
    if (!container || !fill) return;

    if (reducedMotion) {
      gsap.set(fill, { scaleY: 1, transformOrigin: 'top' });
      return;
    }

    gsap.set(fill, { scaleY: 0, transformOrigin: 'top' });
    const trigger = ScrollTrigger.create({
      trigger: container,
      start: 'top 62%',
      end: 'bottom 78%',
      scrub: 0.6,
      onUpdate: (self) => gsap.set(fill, { scaleY: self.progress }),
    });

    return () => trigger.kill();
  }, [containerRef, reducedMotion]);

  return (
    <div
      className="pointer-events-none absolute bottom-0 left-[24px] top-0 w-px lg:left-[168px]"
      aria-hidden
    >
      <div className="absolute inset-0 bg-foreground/15" />
      <div
        ref={fillRef}
        className="absolute inset-0 origin-top bg-gradient-to-b from-primary via-accent to-primary/10"
      />
    </div>
  );
}
