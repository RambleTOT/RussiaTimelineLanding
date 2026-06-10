/**
 * Category metadata — single source of truth for ordering, colours and labels.
 * This module is intentionally framework-free (no React / lucide imports) so it
 * can be consumed by both the browser app and the Node import/enrich scripts.
 * Icon mapping lives in `categoryIcons.tsx`.
 */

export interface CategoryMeta {
  /** stable ascii id (used for filters, query params, css hooks) */
  id: string;
  /** exact label as it appears in the Excel `Раздел` column */
  label: string;
  /** short display label for tight UI (chips, minimap) */
  short: string;
  /** accent colour (hex) for borders, dots, badges */
  accent: string;
  /** one-line description of what the category covers */
  description: string;
}

export const CATEGORIES: CategoryMeta[] = [
  {
    id: 'politics',
    label: 'Политика и государство',
    short: 'Политика',
    accent: '#B45309',
    description: 'Власть, выборы, конституция, государственное устройство.',
  },
  {
    id: 'economy',
    label: 'Экономика и социальная жизнь',
    short: 'Экономика',
    accent: '#2563A8',
    description: 'Реформы, кризисы, уровень жизни и социальная политика.',
  },
  {
    id: 'foreign',
    label: 'Внешняя политика',
    short: 'Внешняя',
    accent: '#0F766E',
    description: 'Отношения с другими странами, договоры, конфликты.',
  },
  {
    id: 'culture',
    label: 'Культура, общество и медиа',
    short: 'Культура',
    accent: '#B23A6A',
    description: 'СМИ, искусство, общество и общественные настроения.',
  },
  {
    id: 'science',
    label: 'Наука, технологии и цифровизация',
    short: 'Наука',
    accent: '#6D4AA8',
    description: 'Технологии, интернет, наука и цифровая экономика.',
  },
  {
    id: 'sport',
    label: 'Спорт',
    short: 'Спорт',
    accent: '#3F7D34',
    description: 'Крупные спортивные события и достижения.',
  },
  {
    id: 'security',
    label: 'Терроризм и безопасность',
    short: 'Безопасность',
    accent: '#C0392B',
    description: 'Теракты, чрезвычайные ситуации и вопросы безопасности.',
  },
];

/** Synthetic category for the «Главная хронология» (historical overview) mode. */
export const OVERVIEW_CATEGORY: CategoryMeta = {
  id: 'overview',
  label: 'Главная хронология',
  short: 'Хроника',
  accent: '#5B6470',
  description: 'Ключевые вехи, формирующие общий ход истории.',
};

const BY_LABEL = new Map<string, CategoryMeta>(
  [...CATEGORIES, OVERVIEW_CATEGORY].map((c) => [c.label, c]),
);

const BY_ID = new Map<string, CategoryMeta>(
  [...CATEGORIES, OVERVIEW_CATEGORY].map((c) => [c.id, c]),
);

const FALLBACK: CategoryMeta = {
  id: 'other',
  label: 'Прочее',
  short: 'Прочее',
  accent: '#6B7280',
  description: 'События вне основных категорий.',
};

export function getCategoryByLabel(label: string): CategoryMeta {
  return BY_LABEL.get(label.trim()) ?? FALLBACK;
}

export function getCategoryById(id: string): CategoryMeta {
  return BY_ID.get(id) ?? FALLBACK;
}

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id);
