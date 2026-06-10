/**
 * Web-enrichment script.
 *
 *   npm run enrich:events                 # all events
 *   npm run enrich:events -- --limit=10   # only the first 10
 *
 * For each event it asks a SearchProvider for trustworthy sources and writes
 * the result (a short summary + up to 3 sources) to src/data/events.enriched.json.
 *
 * It NEVER invents links: only results from a curated allow-list of reputable
 * domains are kept, and the default MockSearchProvider returns nothing — so the
 * project runs and stays honest without any API keys. Set SEARCH_PROVIDER=tavily
 * and TAVILY_API_KEY to enable real web search.
 */
import 'dotenv/config';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  TimelineEventsSchema,
  EnrichedEntriesSchema,
  type TimelineEvent,
  type EnrichedEntry,
  type EventSource,
} from '../lib/validators';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(SCRIPT_DIR, '../data');
const EVENTS_PATH = resolve(DATA_DIR, 'events.json');
const ENRICHED_PATH = resolve(DATA_DIR, 'events.enriched.json');

const RATE_MS = Number(process.env.ENRICH_RATE_MS) || 1100;
const MAX_SOURCES = 3;

/** Reputable domains, in rough priority order. Anything else is discarded. */
const TRUSTED_DOMAINS = [
  'britannica.com',
  'un.org',
  'kremlin.ru',
  'prlib.ru',
  'bbc.com',
  'bbc.co.uk',
  'reuters.com',
  'apnews.com',
  'nytimes.com',
  'theguardian.com',
  'rferl.org',
  'dw.com',
  'tass.ru',
  'interfax.ru',
  'kommersant.ru',
  'vedomosti.ru',
  'rbc.ru',
  'meduza.io',
  'jstor.org',
  'history.com',
  'encyclopedia.com',
  'wikipedia.org',
];

interface SearchResult {
  title: string;
  url: string;
  content?: string;
}
interface SearchResponse {
  answer?: string;
  results: SearchResult[];
}
interface SearchProvider {
  readonly name: string;
  search(query: string): Promise<SearchResponse>;
}

/** Default provider — returns nothing, so no sources are fabricated. */
class MockSearchProvider implements SearchProvider {
  readonly name = 'mock';
  async search(): Promise<SearchResponse> {
    return { results: [] };
  }
}

/** Real provider backed by the Tavily Search API (grounded answer + sources). */
class TavilySearchProvider implements SearchProvider {
  readonly name = 'tavily';
  constructor(private readonly apiKey: string) {}

  async search(query: string): Promise<SearchResponse> {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: this.apiKey,
        query,
        max_results: 6,
        search_depth: 'basic',
        include_answer: true,
      }),
    });
    if (!res.ok) throw new Error(`Tavily вернул статус ${res.status}`);
    const data = (await res.json()) as {
      answer?: string;
      results?: Array<{ title?: string; url?: string; content?: string }>;
    };
    return {
      answer: data.answer,
      results: (data.results ?? [])
        .filter((r): r is { title: string; url: string; content?: string } =>
          Boolean(r.url && r.title),
        )
        .map((r) => ({ title: r.title, url: r.url, content: r.content })),
    };
  }
}

function createProvider(): SearchProvider {
  const provider = (process.env.SEARCH_PROVIDER ?? 'mock').toLowerCase();
  if (provider === 'tavily' && process.env.TAVILY_API_KEY) {
    return new TavilySearchProvider(process.env.TAVILY_API_KEY);
  }
  return new MockSearchProvider();
}

function hostnameOf(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

/** Keep only trusted domains, dedupe by host, cap to MAX_SOURCES. */
function selectSources(results: SearchResult[]): EventSource[] {
  const seen = new Set<string>();
  const picked: EventSource[] = [];

  for (const domain of TRUSTED_DOMAINS) {
    for (const r of results) {
      const host = hostnameOf(r.url);
      if (!host || seen.has(host)) continue;
      if (host === domain || host.endsWith(`.${domain}`)) {
        seen.add(host);
        picked.push({ title: r.title.trim(), url: r.url, publisher: host });
        if (picked.length >= MAX_SOURCES) return picked;
      }
    }
  }
  return picked;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function parseLimit(): number | null {
  const arg = process.argv.find((a) => a.startsWith('--limit='));
  if (!arg) return null;
  const n = Number(arg.slice('--limit='.length));
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
}

function loadExistingEnriched(): EnrichedEntry[] {
  if (!existsSync(ENRICHED_PATH)) return [];
  try {
    return EnrichedEntriesSchema.parse(JSON.parse(readFileSync(ENRICHED_PATH, 'utf8')));
  } catch {
    return [];
  }
}

async function main(): Promise<void> {
  if (!existsSync(EVENTS_PATH)) {
    throw new Error('Сначала выполните импорт: npm run import:xlsx');
  }

  const events: TimelineEvent[] = TimelineEventsSchema.parse(
    JSON.parse(readFileSync(EVENTS_PATH, 'utf8')),
  );
  const provider = createProvider();
  const limit = parseLimit();
  const targets = limit ? events.slice(0, limit) : events;

  console.log(`\n🔎 Обогащение источниками`);
  console.log(`  · провайдер: ${provider.name}`);
  console.log(`  · событий к обработке: ${targets.length}${limit ? ` (лимит ${limit})` : ''}`);
  if (provider.name === 'mock') {
    console.log(
      `  · режим заглушки: реальные запросы не выполняются, источники не выдумываются.`,
    );
  }

  const byId = new Map<string, EnrichedEntry>(loadExistingEnriched().map((e) => [e.id, e]));
  let withSources = 0;

  for (let i = 0; i < targets.length; i++) {
    const event = targets[i];
    const query = `${event.title} Россия ${event.year}`;

    try {
      const response = await provider.search(query);
      const sources = selectSources(response.results);
      const summary = response.answer?.trim();

      if (sources.length > 0 || summary) {
        byId.set(event.id, {
          id: event.id,
          ...(summary ? { enrichedSummary: summary.slice(0, 600) } : {}),
          ...(sources.length ? { sources } : {}),
        });
        if (sources.length) withSources += 1;
      }
      console.log(`  [${i + 1}/${targets.length}] ${event.title} — источников: ${sources.length}`);
    } catch (err) {
      console.warn(
        `  [${i + 1}/${targets.length}] ${event.title} — ошибка: ${
          err instanceof Error ? err.message : 'неизвестно'
        }`,
      );
    }

    if (provider.name !== 'mock' && i < targets.length - 1) {
      await sleep(RATE_MS);
    }
  }

  const output = [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
  writeFileSync(ENRICHED_PATH, `${JSON.stringify(output, null, 2)}\n`, 'utf8');

  console.log(`\n✅ Готово. Событий с источниками: ${withSources}. Записано в events.enriched.json\n`);
}

main().catch((err) => {
  console.error(`\n❌ ${err instanceof Error ? err.message : err}\n`);
  process.exit(1);
});
