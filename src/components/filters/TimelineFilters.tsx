import { Search, X, RotateCcw, History, List, AlignLeft, AlignJustify } from 'lucide-react';
import { Container } from '@/components/layout/Container';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CATEGORIES } from '@/lib/categories';
import { getCategoryIcon } from '@/lib/categoryIcons';
import { cn } from '@/lib/utils';
import { useUiStore, type TimelineMode, type DetailLevel } from '@/store/ui-store';

interface CategoryChipProps {
  active: boolean;
  accent?: string;
  onClick: () => void;
  children: React.ReactNode;
}

function CategoryChip({ active, accent, onClick, children }: CategoryChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60',
        !active && 'border-border text-muted-foreground hover:border-foreground/25 hover:text-foreground',
        active && !accent && 'border-primary/50 bg-primary/15 text-primary',
      )}
      style={
        active && accent
          ? { color: accent, borderColor: `${accent}66`, backgroundColor: `${accent}1f` }
          : undefined
      }
    >
      {children}
    </button>
  );
}

interface TimelineFiltersProps {
  resultCount: number;
  totalCount: number;
}

export function TimelineFilters({ resultCount, totalCount }: TimelineFiltersProps) {
  const mode = useUiStore((s) => s.mode);
  const activeCategories = useUiStore((s) => s.activeCategories);
  const query = useUiStore((s) => s.query);
  const detailLevel = useUiStore((s) => s.detailLevel);
  const setMode = useUiStore((s) => s.setMode);
  const toggleCategory = useUiStore((s) => s.toggleCategory);
  const clearCategories = useUiStore((s) => s.clearCategories);
  const setQuery = useUiStore((s) => s.setQuery);
  const setDetailLevel = useUiStore((s) => s.setDetailLevel);
  const resetFilters = useUiStore((s) => s.resetFilters);

  const hasActiveFilters = activeCategories.length > 0 || query.trim().length > 0;
  const isOverview = mode === 'overview';

  return (
    <div className="sticky top-0 z-40 border-b border-border/60 glass-strong">
      <Container className="py-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          {/* Mode */}
          <ToggleGroup
            type="single"
            value={mode}
            onValueChange={(v) => v && setMode(v as TimelineMode)}
            aria-label="Режим просмотра"
          >
            <ToggleGroupItem value="overview" title="Исторический обзор">
              <History className="size-3.5" />
              Обзор
            </ToggleGroupItem>
            <ToggleGroupItem value="all" title="Все события">
              <List className="size-3.5" />
              Все события
            </ToggleGroupItem>
          </ToggleGroup>

          <div className="ml-auto flex flex-1 items-center justify-end gap-3 sm:flex-none">
            {/* Search */}
            <div className="relative w-full max-w-[260px] sm:w-64">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Поиск по событиям…"
                aria-label="Поиск по событиям"
                className="h-9 pl-9 pr-9"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Очистить поиск"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Detail level */}
            <ToggleGroup
              type="single"
              value={detailLevel}
              onValueChange={(v) => v && setDetailLevel(v as DetailLevel)}
              aria-label="Уровень детализации"
              className="hidden sm:inline-flex"
            >
              <ToggleGroupItem value="short">
                <AlignLeft className="size-3.5" />
                Кратко
              </ToggleGroupItem>
              <ToggleGroupItem value="full">
                <AlignJustify className="size-3.5" />
                Подробно
              </ToggleGroupItem>
            </ToggleGroup>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={resetFilters}
                  disabled={!hasActiveFilters}
                  aria-label="Сбросить фильтры"
                >
                  <RotateCcw className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Сбросить фильтры</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Category chips — hidden in overview mode (overview has no categories) */}
        {!isOverview && (
          <div className="mt-3 flex items-center gap-2 overflow-x-auto fade-x no-scrollbar pb-0.5">
            <CategoryChip active={activeCategories.length === 0} onClick={clearCategories}>
              Все
            </CategoryChip>
            {CATEGORIES.map((cat) => {
              const Icon = getCategoryIcon(cat.id);
              const active = activeCategories.includes(cat.id);
              return (
                <CategoryChip
                  key={cat.id}
                  active={active}
                  accent={cat.accent}
                  onClick={() => toggleCategory(cat.id)}
                >
                  <Icon className="size-3.5" aria-hidden />
                  {cat.short}
                </CategoryChip>
              );
            })}
          </div>
        )}

        <p className="mt-2.5 font-mono text-[11px] text-muted-foreground" aria-live="polite">
          {isOverview ? 'Главная хронология · ' : ''}
          Показано {resultCount} из {totalCount} событий
        </p>
      </Container>
    </div>
  );
}
