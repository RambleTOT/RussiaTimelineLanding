import { useEffect, useMemo, useRef, useState } from 'react';
import { Container } from '@/components/layout/Container';
import { TimelineEventCard } from './TimelineEventCard';
import { TimelineProgressLine } from './TimelineProgressLine';
import { StickyYearMarker } from './StickyYearMarker';
import { TimelineMinimap } from './TimelineMinimap';
import { groupByYear } from '@/lib/timeline';
import { getCategoryByLabel } from '@/lib/categories';
import { scrollToTarget } from '@/lib/smooth-scroll';
import { pluralizeRu } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { TimelineEvent } from '@/lib/validators';
import type { DetailLevel } from '@/store/ui-store';

const decadeOf = (year: number) => Math.floor(year / 10) * 10;
const eventsWord = (n: number) => pluralizeRu(n, ['событие', 'события', 'событий']);

interface TimelineProps {
  events: TimelineEvent[];
  detailLevel: DetailLevel;
}

/** A single dot sitting on the spine, aligned with a card. */
function TimelineNode({ accent }: { accent: string }) {
  return (
    <span
      className="pointer-events-none absolute left-[-32px] top-[26px] z-10 -translate-x-1/2 -translate-y-1/2"
      aria-hidden
    >
      <span
        className="block size-3 rounded-full ring-4 ring-background transition-transform"
        style={{ backgroundColor: accent }}
      />
    </span>
  );
}

export function Timeline({ events, detailLevel }: TimelineProps) {
  const groups = useMemo(() => groupByYear(events), [events]);
  const years = useMemo(() => groups.map((g) => g.year), [groups]);
  const decadeCounts = useMemo(() => {
    const counts = new Map<number, number>();
    for (const g of groups) {
      const d = decadeOf(g.year);
      counts.set(d, (counts.get(d) ?? 0) + g.events.length);
    }
    return counts;
  }, [groups]);
  const containerRef = useRef<HTMLDivElement>(null);
  const blockRefs = useRef(new Map<number, HTMLElement>());
  const [activeYear, setActiveYear] = useState<number | null>(years[0] ?? null);

  // Keep the active year valid as filters change the dataset.
  useEffect(() => {
    if (years.length && (activeYear == null || !years.includes(activeYear))) {
      setActiveYear(years[0]);
    }
  }, [years, activeYear]);

  // Track which year block is closest to the marker line.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const top = visible[0];
        if (top) {
          const year = Number((top.target as HTMLElement).dataset.year);
          if (!Number.isNaN(year)) setActiveYear(year);
        }
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: 0 },
    );
    blockRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [groups]);

  const registerBlock = (year: number) => (el: HTMLElement | null) => {
    if (el) blockRefs.current.set(year, el);
    else blockRefs.current.delete(year);
  };

  const goToYear = (year: number) => {
    const el = blockRefs.current.get(year);
    if (el) scrollToTarget(el, { offset: -120 });
  };

  if (groups.length === 0) return null;

  const activeGroup = groups.find((g) => g.year === activeYear) ?? groups[0];

  return (
    <div className="relative">
      <Container>
        <div ref={containerRef} className="relative pl-[56px] lg:pl-[200px]">
          <TimelineProgressLine containerRef={containerRef} />

          {/* Desktop sticky year marker in the left gutter (offset below the
              sticky filter bar so the big year is never clipped) */}
          <div className="pointer-events-none absolute left-0 top-0 hidden h-full w-[148px] lg:block">
            <div className="sticky top-[168px] pr-7 text-right">
              <StickyYearMarker
                year={activeGroup?.year ?? null}
                periodLabel={activeGroup?.periodLabel ?? ''}
              />
            </div>
          </div>

          <div className="pb-16">
            {groups.map((group, index) => {
              const decade = decadeOf(group.year);
              const isNewDecade = index === 0 || decade !== decadeOf(groups[index - 1].year);
              return (
                <div
                  key={group.year}
                  ref={registerBlock(group.year)}
                  data-year={group.year}
                  className="relative pt-6 first:pt-2"
                >
                  {/* Decade chapter divider — large outlined numeral */}
                  {isNewDecade && (
                    <div
                      className={cn(
                        'mb-7 flex items-end justify-between gap-4 border-b border-foreground/15 pb-2',
                        index === 0 ? 'mt-0' : 'mt-14',
                      )}
                    >
                      <span
                        className="select-none text-6xl font-extrabold leading-[0.85] tracking-tight sm:text-7xl"
                        style={{
                          WebkitTextStroke: '1.2px hsl(var(--foreground) / 0.22)',
                          color: 'transparent',
                        }}
                      >
                        {decade}
                      </span>
                      <span className="whitespace-nowrap pb-1.5 text-xs tabular-nums text-muted-foreground">
                        {decade}-е · {decadeCounts.get(decade)} {eventsWord(decadeCounts.get(decade) ?? 0)}
                      </span>
                    </div>
                  )}

                  {/* Inline period label — visible on mobile where the gutter is hidden */}
                  <div className="mb-4 lg:hidden">
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {group.periodLabel}
                    </span>
                  </div>

                  <div className="space-y-5">
                    {group.events.map((event) => (
                      <div key={event.id} className="relative">
                        <TimelineNode accent={getCategoryByLabel(event.category).accent} />
                        <TimelineEventCard event={event} detailLevel={detailLevel} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Container>

      <TimelineMinimap years={years} activeYear={activeYear} onSelect={goToYear} />
    </div>
  );
}
