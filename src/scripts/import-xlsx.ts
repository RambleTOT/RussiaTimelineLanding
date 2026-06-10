/**
 * Excel → JSON importer.
 *
 *   npm run import:xlsx
 *
 * Reads the workbook (sheets «Все события» and «Главная хронология»),
 * normalises the rows, validates them with zod and writes:
 *   - src/data/events.json        (all events — main dataset)
 *   - src/data/main-events.json   (historical-overview dataset)
 *   - src/data/events.enriched.json  (created empty if missing; never clobbered)
 *
 * The source .xlsx is read-only and never modified.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as XLSX from 'xlsx';

import { OVERVIEW_CATEGORY, CATEGORIES } from '../lib/categories';
import { makeEventId, formatPeriod } from '../lib/format';
import { TimelineEventsSchema, type TimelineEvent } from '../lib/validators';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(SCRIPT_DIR, '../..');
const DATA_DIR = resolve(PROJECT_ROOT, 'src/data');

const SHEET_ALL = 'Все события';
const SHEET_MAIN = 'Главная хронология';

function resolveWorkbookPath(): string {
  const cliArg = process.argv.find((a) => a.startsWith('--file='));
  const candidates = [
    cliArg?.slice('--file='.length),
    process.env.XLSX_PATH,
    resolve(PROJECT_ROOT, 'История_России_1991-2022_события.xlsx'),
  ].filter((p): p is string => Boolean(p));

  for (const candidate of candidates) {
    const abs = resolve(candidate);
    if (existsSync(abs)) return abs;
  }
  throw new Error(
    `Не найден .xlsx файл. Положите «История_России_1991-2022_события.xlsx» в корень проекта ` +
      `или укажите путь: npm run import:xlsx -- --file=/path/to/file.xlsx`,
  );
}

type Row = Record<string, unknown>;

function str(value: unknown): string {
  return String(value ?? '').trim();
}

function num(value: unknown): number {
  if (typeof value === 'number') return value;
  const parsed = Number(String(value).replace(/[^\d.-]/g, ''));
  return parsed;
}

function importAllEvents(wb: XLSX.WorkBook): TimelineEvent[] {
  const sheet = wb.Sheets[SHEET_ALL];
  if (!sheet) throw new Error(`Лист «${SHEET_ALL}» не найден в файле.`);
  const rows = XLSX.utils.sheet_to_json<Row>(sheet, { defval: '' });
  const used = new Set<string>();
  const events: TimelineEvent[] = [];

  for (const row of rows) {
    const title = str(row['Событие']);
    if (!title) continue;
    const year = num(row['Год начала']);
    if (!Number.isFinite(year)) {
      console.warn(`  ⚠ пропущена строка без корректного года: «${title}»`);
      continue;
    }
    const period = formatPeriod(str(row['Период / год'])) || String(year);
    const categoryLabel = str(row['Раздел']);
    const importance = str(row['Почему важно']);
    events.push({
      id: makeEventId(year, title, used),
      period,
      year,
      category: categoryLabel,
      title,
      importance,
    });
  }

  events.sort((a, b) => a.year - b.year);
  return events;
}

function importOverview(wb: XLSX.WorkBook): TimelineEvent[] {
  const sheet = wb.Sheets[SHEET_MAIN];
  if (!sheet) throw new Error(`Лист «${SHEET_MAIN}» не найден в файле.`);
  const rows = XLSX.utils.sheet_to_json<Row>(sheet, { defval: '' });
  const used = new Set<string>();
  const events: TimelineEvent[] = [];

  for (const row of rows) {
    const title = str(row['Главное событие']);
    if (!title) continue;
    const year = num(row['Год начала']);
    if (!Number.isFinite(year)) continue;
    const period = formatPeriod(str(row['Период / год'])) || String(year);
    events.push({
      id: makeEventId(year, title, used),
      period,
      year,
      category: OVERVIEW_CATEGORY.label,
      title,
      importance: '',
    });
  }

  events.sort((a, b) => a.year - b.year);
  return events;
}

function writeJson(filename: string, data: unknown): void {
  const target = resolve(DATA_DIR, filename);
  writeFileSync(target, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  console.log(`  ✓ ${filename}`);
}

function main(): void {
  const xlsxPath = resolveWorkbookPath();
  console.log(`\n📖 Чтение: ${xlsxPath}`);

  const wb = XLSX.read(readFileSync(xlsxPath), { type: 'buffer' });

  const events = TimelineEventsSchema.parse(importAllEvents(wb));
  const overview = TimelineEventsSchema.parse(importOverview(wb));

  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

  console.log(`\n💾 Запись данных в src/data/`);
  writeJson('events.json', events);
  writeJson('main-events.json', overview);

  const enrichedPath = resolve(DATA_DIR, 'events.enriched.json');
  if (!existsSync(enrichedPath)) {
    writeFileSync(enrichedPath, '[]\n', 'utf8');
    console.log('  ✓ events.enriched.json (пустой — заполняется через npm run enrich:events)');
  } else {
    console.log('  · events.enriched.json уже существует — оставлен без изменений');
  }

  // Summary
  const byCategory = new Map<string, number>();
  for (const e of events) byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + 1);
  const years = events.map((e) => e.year);
  console.log(`\n📊 Итог:`);
  console.log(`  · всего событий: ${events.length}`);
  console.log(`  · главная хронология: ${overview.length}`);
  console.log(`  · диапазон лет: ${Math.min(...years)}–${Math.max(...years)}`);
  console.log(`  · категорий: ${byCategory.size}`);
  for (const { label } of CATEGORIES) {
    console.log(`     – ${label}: ${byCategory.get(label) ?? 0}`);
  }
  console.log('\n✅ Импорт завершён.\n');
}

main();
