import { Archive, AlertTriangle } from 'lucide-react';
import { Container } from './Container';
import { STATS } from '@/lib/events-data';

export function Footer() {
  return (
    <footer className="relative mt-24 border-t border-border/60 py-14">
      <Container>
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-serif text-lg">
              <Archive className="size-5 text-primary" aria-hidden />
              Россия 1991–2022
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              Интерактивный цифровой атлас ключевых событий современной России. Образовательный
              проект — материал для самостоятельного изучения и проверки.
            </p>
          </div>

          <div className="space-y-2 text-sm">
            <p className="font-mono text-[11px] tracking-normal text-muted-foreground">
              Данные
            </p>
            <p className="text-foreground/80">{STATS.total} событий</p>
            <p className="text-foreground/80">{STATS.categories} категорий</p>
            <p className="text-foreground/80">
              {STATS.yearStart}–{STATS.yearEnd}
            </p>
          </div>

          <div className="space-y-2 text-sm">
            <p className="font-mono text-[11px] tracking-normal text-muted-foreground">
              О точности
            </p>
            <p className="flex items-start gap-2 text-muted-foreground">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-primary/80" aria-hidden />
              <span>
                ИИ может ошибаться. Сверяйте важные факты с первоисточниками и проверенными
                энциклопедиями.
              </span>
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-border/40 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>© {STATS.yearEnd} · Линия времени современной России</span>
          <span className="font-mono">Editorial · Archive · Atlas</span>
        </div>
      </Container>
    </footer>
  );
}
