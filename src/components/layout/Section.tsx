import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SectionProps {
  id?: string;
  className?: string;
  children: ReactNode;
  'aria-label'?: string;
}

export function Section({ id, className, children, ...rest }: SectionProps) {
  return (
    <section id={id} className={cn('relative', className)} {...rest}>
      {children}
    </section>
  );
}

/** Small eyebrow used above section headings. */
export function Eyebrow({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 font-mono text-xs tracking-normal text-muted-foreground',
        className,
      )}
    >
      {children}
    </span>
  );
}
