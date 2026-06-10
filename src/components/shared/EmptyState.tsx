import { SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUiStore } from '@/store/ui-store';

export function EmptyState() {
  const resetFilters = useUiStore((s) => s.resetFilters);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-xl glass px-8 py-16 text-center">
      <div className="grid size-14 place-items-center rounded-full border border-border bg-foreground/[0.05]">
        <SearchX className="size-6 text-muted-foreground" aria-hidden />
      </div>
      <h3 className="font-serif text-xl">Нет событий по выбранным фильтрам</h3>
      <p className="max-w-xs text-sm text-muted-foreground">
        Попробуйте изменить поисковый запрос или включить больше категорий.
      </p>
      <Button variant="outline" size="sm" onClick={resetFilters}>
        Сбросить фильтры
      </Button>
    </div>
  );
}
