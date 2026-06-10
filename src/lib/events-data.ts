import allRaw from '@/data/events.json';
import overviewRaw from '@/data/main-events.json';
import enrichedRaw from '@/data/events.enriched.json';
import {
  TimelineEventsSchema,
  EnrichedEntriesSchema,
  type TimelineEvent,
  type EnrichedEntry,
} from './validators';
import { CATEGORIES } from './categories';

/** Merge enrichment (summary + sources) into events by id. */
function mergeEnriched(events: TimelineEvent[], enriched: EnrichedEntry[]): TimelineEvent[] {
  if (enriched.length === 0) return events;
  const byId = new Map(enriched.map((e) => [e.id, e]));
  return events.map((event) => {
    const extra = byId.get(event.id);
    if (!extra) return event;
    return {
      ...event,
      enrichedSummary: extra.enrichedSummary ?? event.enrichedSummary,
      sources: extra.sources && extra.sources.length > 0 ? extra.sources : event.sources,
      image: extra.image ?? event.image,
    };
  });
}

// Validate at load time — fails loudly in dev if the JSON drifts from the schema.
const baseEvents = TimelineEventsSchema.parse(allRaw);
const overviewEvents = TimelineEventsSchema.parse(overviewRaw);
const enrichedEntries = EnrichedEntriesSchema.parse(enrichedRaw);

export const ALL_EVENTS: TimelineEvent[] = mergeEnriched(baseEvents, enrichedEntries);
export const OVERVIEW_EVENTS: TimelineEvent[] = mergeEnriched(overviewEvents, enrichedEntries);

/** Fast id → event lookup across both datasets (for deep links / modals). */
export const EVENT_BY_ID: ReadonlyMap<string, TimelineEvent> = new Map(
  [...OVERVIEW_EVENTS, ...ALL_EVENTS].map((e) => [e.id, e]),
);

/** Ids that belong to the historical-overview dataset. */
export const OVERVIEW_IDS: ReadonlySet<string> = new Set(OVERVIEW_EVENTS.map((e) => e.id));

const years = ALL_EVENTS.map((e) => e.year);

export const STATS = {
  total: ALL_EVENTS.length,
  overviewTotal: OVERVIEW_EVENTS.length,
  categories: CATEGORIES.length,
  yearStart: Math.min(...years),
  yearEnd: Math.max(...years),
} as const;
