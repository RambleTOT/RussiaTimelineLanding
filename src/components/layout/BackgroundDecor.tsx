import { cn } from '@/lib/utils';

/** A small technical-drawing crosshair. */
function Plus({ className }: { className?: string }) {
  return (
    <span className={cn('absolute block size-3', className)} aria-hidden>
      <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-foreground/25" />
      <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-foreground/25" />
    </span>
  );
}

/**
 * Fixed, page-wide decorative layer in the «archival atlas / blueprint» spirit:
 * a faint grid, two vertical margin guides framing the content column, and
 * registration crosshairs at the corners. Purely cosmetic.
 */
export function BackgroundDecor() {
  // x-position of the content margins (≈ container edge), clamped to gutter.
  const leftGuide = 'left-[max(1.25rem,calc(50%-37rem))]';
  const rightGuide = 'right-[max(1.25rem,calc(50%-37rem))]';

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      {/* faint grid, fading toward the bottom */}
      <div className="absolute inset-0 bg-grid opacity-[0.6] [mask-image:linear-gradient(to_bottom,#000,#000_70%,transparent)]" />

      {/* vertical margin guides */}
      <div className={cn('absolute inset-y-0 w-px bg-foreground/[0.06]', leftGuide)} />
      <div className={cn('absolute inset-y-0 w-px bg-foreground/[0.06]', rightGuide)} />

      {/* corner registration marks */}
      <Plus className={cn('top-[88px] -translate-x-1/2 -translate-y-1/2', leftGuide)} />
      <Plus className={cn('top-[88px] translate-x-1/2 -translate-y-1/2', rightGuide)} />
      <Plus className={cn('bottom-[64px] -translate-x-1/2 translate-y-1/2', leftGuide)} />
      <Plus className={cn('bottom-[64px] translate-x-1/2 translate-y-1/2', rightGuide)} />

      {/* soft warm wash, top-left → adds depth without an "AI glow" */}
      <div className="absolute -left-32 top-24 h-[360px] w-[360px] rounded-full bg-primary/[0.04] blur-3xl" />
    </div>
  );
}
