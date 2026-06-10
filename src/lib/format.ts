/**
 * Pure formatting / slug helpers. Shared between the browser app and the Node
 * import script, so no DOM or framework dependencies here.
 */

const RU_TO_LAT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
  и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch',
  ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};

/** Transliterate Cyrillic → Latin so anchors / ids are ASCII and stable. */
export function transliterate(input: string): string {
  return input
    .toLowerCase()
    .split('')
    .map((ch) => (ch in RU_TO_LAT ? RU_TO_LAT[ch] : ch))
    .join('');
}

/** Build a clean url-safe slug (max ~48 chars, no trailing fragments). */
export function slugify(input: string, maxLen = 48): string {
  const base = transliterate(input)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (base.length <= maxLen) return base || 'event';
  // truncate on a word boundary
  const cut = base.slice(0, maxLen);
  const lastDash = cut.lastIndexOf('-');
  return (lastDash > 16 ? cut.slice(0, lastDash) : cut).replace(/-+$/g, '') || 'event';
}

/**
 * Deterministic, collision-free event id: `<year>-<slug>` with a numeric
 * suffix on collision. Pass a shared Set to dedupe across a dataset.
 */
export function makeEventId(year: number, title: string, used: Set<string>): string {
  const base = `${year}-${slugify(title)}`;
  let id = base;
  let n = 2;
  while (used.has(id)) {
    id = `${base}-${n}`;
    n += 1;
  }
  used.add(id);
  return id;
}

export function eventAnchorId(id: string): string {
  return `event-${id}`;
}

export function eventIdFromAnchor(anchor: string): string | null {
  const clean = anchor.replace(/^#/, '');
  return clean.startsWith('event-') ? clean.slice('event-'.length) : null;
}

/** Human period label normalisation: use en-dash only for numeric ranges. */
export function formatPeriod(period: string): string {
  return period.replace(/(\d)\s*[-–—]\s*(\d)/g, '$1–$2').trim();
}

export function pluralizeRu(n: number, forms: [string, string, string]): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1];
  return forms[2];
}
