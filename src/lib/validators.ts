import { z } from 'zod';

/**
 * Canonical data contracts for the timeline. These schemas are the single
 * source of truth — the import script validates against them before writing
 * JSON, and the app re-validates at load time (defensively).
 */

export const SourceSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
  publisher: z.string().min(1).optional(),
});

export const EventImageSchema = z.object({
  url: z.string().url(),
  alt: z.string().optional(),
  credit: z.string().optional(),
  source: z.string().url().optional(),
});

export const TimelineEventSchema = z.object({
  id: z.string().min(1),
  period: z.string().min(1),
  year: z
    .number()
    .int()
    .gte(1985)
    .lte(2030),
  category: z.string().min(1),
  title: z.string().min(1),
  importance: z.string().default(''),
  enrichedSummary: z.string().optional(),
  sources: z.array(SourceSchema).optional(),
  image: EventImageSchema.optional(),
});

export const TimelineEventsSchema = z.array(TimelineEventSchema);

/** Shape stored in events.enriched.json — merged into events by id. */
export const EnrichedEntrySchema = z.object({
  id: z.string().min(1),
  enrichedSummary: z.string().optional(),
  sources: z.array(SourceSchema).optional(),
  image: EventImageSchema.optional(),
});

export const EnrichedEntriesSchema = z.array(EnrichedEntrySchema);

/** Payload accepted by POST /api/ask-event. */
export const AskEventRequestSchema = z.object({
  eventId: z.string().min(1),
  eventTitle: z.string().min(1).max(400),
  year: z.number().int().gte(1985).lte(2030),
  category: z.string().min(1).max(120),
  importance: z.string().max(2000).default(''),
  period: z.string().max(60).optional(),
  question: z.string().min(1).max(1000),
});

export type EventSource = z.infer<typeof SourceSchema>;
export type EventImage = z.infer<typeof EventImageSchema>;
export type TimelineEvent = z.infer<typeof TimelineEventSchema>;
export type EnrichedEntry = z.infer<typeof EnrichedEntrySchema>;
export type AskEventRequest = z.infer<typeof AskEventRequestSchema>;
