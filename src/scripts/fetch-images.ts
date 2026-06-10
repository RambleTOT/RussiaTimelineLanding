/**
 * Per-event image fetcher.
 *
 *   npm run fetch:images
 *   npm run fetch:images -- --limit=10
 *
 * For each event it finds the best-matching Russian Wikipedia article and takes
 * its lead image (real, attributable media from Wikimedia). Results are merged
 * into src/data/events.enriched.json under `image`. Nothing is invented — if no
 * suitable image is found, the field is simply left empty and the UI falls back
 * to a category cover.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  TimelineEventsSchema,
  EnrichedEntriesSchema,
  type TimelineEvent,
  type EnrichedEntry,
  type EventImage,
} from '../lib/validators';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(SCRIPT_DIR, '../data');
const ENRICHED_PATH = resolve(DATA_DIR, 'events.enriched.json');

const RATE_MS = Number(process.env.IMAGES_RATE_MS) || 1000;
const FORCE = process.argv.includes('--force') || process.env.FORCE === '1';
const USER_AGENT =
  'RossiyaTimeline/1.0 (educational timeline project; contact: local-dev) node-fetch';

const WIKI_API = 'https://ru.wikipedia.org/w/api.php';

/** Skip lead images that are just flags / emblems / maps — not illustrative. */
const SKIP_IMAGE = /(flag|coat|герб|флаг|emblem|\.svg$|logo|wappen|orthographic)/i;

interface WikiPage {
  index: number;
  title: string;
  fullurl?: string;
  original?: { source: string };
  thumbnail?: { source: string };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** GET with polite retry/backoff on 429 / 5xx (Wikimedia rate limits). */
async function fetchWithRetry(url: string, attempt = 0): Promise<Response> {
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'ru' },
  });
  if ((res.status === 429 || res.status >= 500) && attempt < 4) {
    const retryAfter = Number(res.headers.get('retry-after'));
    const wait = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 2000 * 2 ** attempt;
    await sleep(wait);
    return fetchWithRetry(url, attempt + 1);
  }
  if (!res.ok) throw new Error(`Wikipedia status ${res.status}`);
  return res;
}

async function findImage(query: string): Promise<EventImage | null> {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    generator: 'search',
    gsrsearch: query,
    gsrlimit: '4',
    gsrnamespace: '0',
    prop: 'pageimages|info',
    piprop: 'original|thumbnail',
    pithumbsize: '1000',
    inprop: 'url',
    redirects: '1',
  });

  const res = await fetchWithRetry(`${WIKI_API}?${params.toString()}`);
  const data = (await res.json()) as { query?: { pages?: Record<string, WikiPage> } };
  const pages = Object.values(data.query?.pages ?? {});
  if (pages.length === 0) return null;

  pages.sort((a, b) => (a.index ?? 99) - (b.index ?? 99));

  for (const page of pages) {
    const src = page.thumbnail?.source ?? page.original?.source;
    if (!src) continue;
    if (SKIP_IMAGE.test(src) || SKIP_IMAGE.test(page.title)) continue;
    return {
      url: src,
      alt: page.title,
      credit: 'Wikimedia / Википедия',
      source: page.fullurl,
    };
  }
  return null;
}

function parseLimit(): number | null {
  const arg = process.argv.find((a) => a.startsWith('--limit='));
  if (!arg) return null;
  const n = Number(arg.slice('--limit='.length));
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
}

function loadJsonArray<T>(file: string, schema: { parse: (v: unknown) => T }): T {
  return schema.parse(JSON.parse(readFileSync(resolve(DATA_DIR, file), 'utf8')));
}

async function main(): Promise<void> {
  const all: TimelineEvent[] = [
    ...loadJsonArray('events.json', TimelineEventsSchema),
    ...loadJsonArray('main-events.json', TimelineEventsSchema),
  ];
  // de-dupe by id (overview ids may repeat a few main events)
  const uniq = [...new Map(all.map((e) => [e.id, e])).values()];

  const existing: EnrichedEntry[] = existsSync(ENRICHED_PATH)
    ? EnrichedEntriesSchema.parse(JSON.parse(readFileSync(ENRICHED_PATH, 'utf8')))
    : [];
  const byId = new Map<string, EnrichedEntry>(existing.map((e) => [e.id, e]));

  // Incremental by default: only fetch events that don't already have an image.
  const pending = FORCE ? uniq : uniq.filter((e) => !byId.get(e.id)?.image);
  const limit = parseLimit();
  const targets = limit ? pending.slice(0, limit) : pending;

  console.log(`\n🖼  Поиск изображений (Wikipedia)`);
  console.log(
    `  · уже есть: ${uniq.length - pending.length} · к обработке: ${targets.length}${
      limit ? ` (лимит ${limit})` : ''
    }`,
  );

  let found = 0;
  for (let i = 0; i < targets.length; i++) {
    const event = targets[i];
    try {
      const image = await findImage(event.title);
      if (image) {
        const prev = byId.get(event.id) ?? { id: event.id };
        byId.set(event.id, { ...prev, image });
        found += 1;
      }
      console.log(`  [${i + 1}/${targets.length}] ${event.title} — ${image ? '🖼' : '—'}`);
    } catch (err) {
      console.warn(
        `  [${i + 1}/${targets.length}] ${event.title} — ошибка: ${
          err instanceof Error ? err.message : 'неизвестно'
        }`,
      );
    }
    if (i < targets.length - 1) await sleep(RATE_MS);
  }

  const output = [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
  writeFileSync(ENRICHED_PATH, `${JSON.stringify(output, null, 2)}\n`, 'utf8');

  console.log(`\n✅ Готово. Изображений найдено: ${found}/${targets.length}.\n`);
}

main().catch((err) => {
  console.error(`\n❌ ${err instanceof Error ? err.message : err}\n`);
  process.exit(1);
});
