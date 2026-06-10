import { Sparkles, AlertTriangle, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CategoryBadge } from '@/components/shared/CategoryBadge';
import { SourceList } from '@/components/shared/SourceList';
import { EventCover } from '@/components/shared/EventCover';
import { EVENT_BY_ID } from '@/lib/events-data';
import { useUiStore } from '@/store/ui-store';
import type { TimelineEvent } from '@/lib/validators';

function DetailBody({ event, onAsk }: { event: TimelineEvent; onAsk: () => void }) {
  const hasSources = Boolean(event.sources && event.sources.length > 0);

  return (
    <>
      {/* Cover */}
      <div className="relative h-44 w-full shrink-0 overflow-hidden sm:h-56">
        <EventCover event={event} showYear={false} />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
        <DialogClose
          className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-card/80 text-foreground/70 backdrop-blur transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
          aria-label="Закрыть"
        >
          <X className="size-4" />
        </DialogClose>
        <div className="absolute inset-x-5 bottom-3 flex flex-wrap items-center gap-2.5">
          <span className="text-sm tabular-nums text-muted-foreground">{event.period}</span>
          <span className="text-muted-foreground/40">·</span>
          <CategoryBadge category={event.category} />
        </div>
      </div>

      {/* Scrollable content */}
      <div className="max-h-[56vh] space-y-6 overflow-y-auto p-5 sm:p-6" data-lenis-prevent>
        <div className="space-y-1.5">
          <DialogTitle className="text-2xl">{event.title}</DialogTitle>
          <DialogDescription className="text-xs">Год начала: {event.year}</DialogDescription>
        </div>

        {event.importance && (
          <section className="space-y-1.5">
            <h4 className="text-xs font-medium text-muted-foreground">Почему это важно</h4>
            <p className="text-sm leading-relaxed text-foreground/90">{event.importance}</p>
          </section>
        )}

        {event.enrichedSummary && (
          <section className="space-y-1.5">
            <h4 className="text-xs font-medium text-muted-foreground">Расширенное описание</h4>
            <p className="text-sm leading-relaxed text-foreground/80">{event.enrichedSummary}</p>
          </section>
        )}

        {hasSources && <SourceList sources={event.sources} />}

        <section className="space-y-3 rounded-xl border border-border bg-foreground/[0.03] p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" aria-hidden />
            <h4 className="text-base font-semibold">Спросить ИИ об этом событии</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            Узнайте о причинах, последствиях и контексте — ответ сформирует ИИ-помощник.
          </p>
          <Button onClick={onAsk} className="w-full sm:w-auto">
            <Sparkles className="size-4" />
            Задать вопрос ИИ
          </Button>
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <AlertTriangle className="size-3.5 shrink-0 text-primary/70" aria-hidden />
            ИИ может ошибаться. Сверяйте важные факты с источниками.
          </p>
        </section>
      </div>
    </>
  );
}

export function EventDetailDrawer() {
  const detailEventId = useUiStore((s) => s.detailEventId);
  const closeDetail = useUiStore((s) => s.closeDetail);
  const openAsk = useUiStore((s) => s.openAsk);
  const event = detailEventId ? EVENT_BY_ID.get(detailEventId) : null;

  const handleAsk = () => {
    if (!event) return;
    closeDetail();
    openAsk(event.id);
  };

  return (
    <Dialog open={Boolean(event)} onOpenChange={(open) => !open && closeDetail()}>
      <DialogContent
        hideClose
        className="max-w-2xl gap-0 overflow-hidden p-0"
        aria-describedby={undefined}
      >
        {event && <DetailBody event={event} onAsk={handleAsk} />}
      </DialogContent>
    </Dialog>
  );
}
