import { useMemo } from 'react';
import { Section } from '@/components/layout/Section';
import { TimelineFilters } from '@/components/filters/TimelineFilters';
import { Timeline } from './Timeline';
import { EmptyState } from '@/components/shared/EmptyState';
import { ALL_EVENTS, OVERVIEW_EVENTS } from '@/lib/events-data';
import { filterEvents } from '@/lib/timeline';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useUiStore } from '@/store/ui-store';

export function TimelineSection() {
  const mode = useUiStore((s) => s.mode);
  const activeCategories = useUiStore((s) => s.activeCategories);
  const query = useUiStore((s) => s.query);
  const detailLevel = useUiStore((s) => s.detailLevel);
  const debouncedQuery = useDebouncedValue(query, 200);

  const dataset = mode === 'overview' ? OVERVIEW_EVENTS : ALL_EVENTS;

  const filtered = useMemo(
    () =>
      filterEvents(dataset, {
        categories: mode === 'overview' ? [] : activeCategories,
        query: debouncedQuery,
      }),
    [dataset, mode, activeCategories, debouncedQuery],
  );

  return (
    <Section id="timeline" aria-label="Линия времени" className="scroll-mt-2 py-10">
      <TimelineFilters resultCount={filtered.length} totalCount={dataset.length} />
      <div className="pt-12">
        {filtered.length > 0 ? (
          <Timeline events={filtered} detailLevel={detailLevel} />
        ) : (
          <div className="py-24">
            <EmptyState />
          </div>
        )}
      </div>
    </Section>
  );
}
