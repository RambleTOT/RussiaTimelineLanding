import { cn } from '@/lib/utils';

interface TimelineMinimapProps {
  years: number[];
  activeYear: number | null;
  onSelect: (year: number) => void;
}

/** Fixed year navigator on the right edge (desktop / xl only). */
export function TimelineMinimap({ years, activeYear, onSelect }: TimelineMinimapProps) {
  if (years.length < 2) return null;

  return (
    <nav
      className="fixed right-5 top-1/2 z-30 hidden -translate-y-1/2 xl:block"
      aria-label="Навигация по годам"
    >
      <ul className="flex max-h-[70vh] flex-col items-end gap-1.5 overflow-hidden">
        {years.map((year) => {
          const active = year === activeYear;
          return (
            <li key={year}>
              <button
                type="button"
                onClick={() => onSelect(year)}
                aria-current={active ? 'true' : undefined}
                aria-label={`Перейти к ${year} году`}
                className="group flex items-center gap-2 focus-visible:outline-none"
              >
                <span
                  className={cn(
                    'font-mono text-[10px] tabular-nums transition-all duration-200',
                    active
                      ? 'text-foreground'
                      : 'text-transparent group-hover:text-muted-foreground group-focus-visible:text-muted-foreground',
                  )}
                >
                  {year}
                </span>
                <span
                  className={cn(
                    'h-px rounded-full transition-all duration-200',
                    active
                      ? 'w-6 bg-primary'
                      : 'w-3 bg-foreground/25 group-hover:w-4 group-hover:bg-foreground/35 group-focus-visible:w-4',
                  )}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
