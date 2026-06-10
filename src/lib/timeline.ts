import type { TimelineEvent } from './validators';
import { getCategoryByLabel } from './categories';

export interface YearGroup {
  year: number;
  /** label shown in the sticky year marker (e.g. «1990-е», «1991») */
  periodLabel: string;
  events: TimelineEvent[];
}

/** Group events into ascending year buckets, preserving in-year order. */
export function groupByYear(events: TimelineEvent[]): YearGroup[] {
  const groups = new Map<number, YearGroup>();
  for (const event of events) {
    let group = groups.get(event.year);
    if (!group) {
      group = { year: event.year, periodLabel: event.period, events: [] };
      groups.set(event.year, group);
    }
    group.events.push(event);
  }
  return [...groups.values()].sort((a, b) => a.year - b.year);
}

export interface FilterState {
  /** active category ids; empty array = all categories */
  categories: string[];
  /** free-text search over title + importance */
  query: string;
}

/** Memo-friendly pure filter. */
export function filterEvents(events: TimelineEvent[], filter: FilterState): TimelineEvent[] {
  const active = new Set(filter.categories);
  const q = filter.query.trim().toLowerCase();

  return events.filter((event) => {
    if (active.size > 0) {
      const id = getCategoryByLabel(event.category).id;
      if (!active.has(id)) return false;
    }
    if (q) {
      const haystack = `${event.title} ${event.importance} ${event.period}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

/** Distinct ascending years present in the dataset (for the minimap). */
export function distinctYears(events: TimelineEvent[]): number[] {
  return [...new Set(events.map((e) => e.year))].sort((a, b) => a - b);
}
