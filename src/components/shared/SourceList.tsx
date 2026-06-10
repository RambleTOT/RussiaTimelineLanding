import { ArrowUpRight, BookMarked } from 'lucide-react';
import type { EventSource } from '@/lib/validators';
import { cn } from '@/lib/utils';

interface SourceListProps {
  sources?: EventSource[];
  className?: string;
}

export function SourceList({ sources, className }: SourceListProps) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className={cn('space-y-2', className)}>
      <p className="flex items-center gap-1.5 font-mono text-[11px] tracking-normal text-muted-foreground">
        <BookMarked className="size-3.5" aria-hidden />
        Источники
      </p>
      <ul className="space-y-1">
        {sources.map((source, i) => (
          <li key={`${source.url}-${i}`}>
            <a
              href={source.url}
              target="_blank"
              rel="noreferrer noopener"
              className="group -mx-2 flex items-start gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-foreground/[0.05] focus-visible:bg-foreground/[0.05]"
            >
              <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-accent/70" aria-hidden />
              <span className="flex-1 leading-snug">
                <span className="text-foreground/90 group-hover:text-foreground">
                  {source.title}
                </span>
                {source.publisher && (
                  <span className="ml-1.5 text-muted-foreground">· {source.publisher}</span>
                )}
              </span>
              <ArrowUpRight
                className="mt-0.5 size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
                aria-hidden
              />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
