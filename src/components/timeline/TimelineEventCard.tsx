import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Link2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CategoryBadge } from '@/components/shared/CategoryBadge';
import { SourceList } from '@/components/shared/SourceList';
import { EventCover } from '@/components/shared/EventCover';
import { getCategoryByLabel } from '@/lib/categories';
import { eventAnchorId } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useUiStore, type DetailLevel } from '@/store/ui-store';
import type { TimelineEvent } from '@/lib/validators';

interface TimelineEventCardProps {
  event: TimelineEvent;
  detailLevel: DetailLevel;
}

function TimelineEventCardImpl({ event, detailLevel }: TimelineEventCardProps) {
  const openAsk = useUiStore((s) => s.openAsk);
  const openDetail = useUiStore((s) => s.openDetail);
  const [copied, setCopied] = useState(false);

  const accent = getCategoryByLabel(event.category).accent;
  const isFull = detailLevel === 'full';
  const hasSources = Boolean(event.sources && event.sources.length > 0);

  const copyLink = async () => {
    const url = `${window.location.origin}${window.location.pathname}#${eventAnchorId(event.id)}`;
    try {
      await navigator.clipboard.writeText(url);
      window.history.replaceState(null, '', `#${eventAnchorId(event.id)}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable — silently ignore */
    }
  };

  return (
    <motion.article
      id={eventAnchorId(event.id)}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-12% 0px' }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="group relative flex scroll-mt-32 gap-4 overflow-hidden rounded-xl border border-border bg-card p-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-[0_14px_34px_-20px_rgba(20,20,30,0.35)] sm:gap-5 sm:p-4"
      style={{ borderLeft: `3px solid ${accent}` }}
    >
      <button
        type="button"
        onClick={() => openDetail(event.id)}
        aria-label={`Открыть событие «${event.title}»`}
        className="relative w-[84px] shrink-0 self-stretch overflow-hidden rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 sm:w-[148px]"
      >
        <span className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.04]">
          <EventCover event={event} />
        </span>
      </button>

      <div className="min-w-0 flex-1 py-0.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-xs tabular-nums text-muted-foreground">{event.period}</span>
          <span className="text-muted-foreground/40">·</span>
          <CategoryBadge category={event.category} />
        </div>

        <h3 className="mt-2">
          <button
            type="button"
            onClick={() => openDetail(event.id)}
            className="text-left text-base font-semibold leading-snug tracking-tight text-foreground transition-colors hover:text-primary focus-visible:text-primary focus-visible:outline-none sm:text-lg"
          >
            {event.title}
          </button>
        </h3>

        {event.importance && (
          <p
            className={cn(
              'mt-2.5 text-sm leading-relaxed text-muted-foreground',
              !isFull && 'line-clamp-2',
            )}
          >
            {event.importance}
          </p>
        )}

        {isFull && event.enrichedSummary && (
          <p className="mt-3 border-l-2 border-accent/40 pl-3 text-sm leading-relaxed text-foreground/80">
            {event.enrichedSummary}
          </p>
        )}

        {isFull && hasSources && <SourceList sources={event.sources} className="mt-4" />}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={() => openAsk(event.id)}>
            <Sparkles className="size-4" />
            Задать вопрос ИИ
          </Button>
          <Button size="sm" variant="ghost" onClick={() => openDetail(event.id)}>
            Подробнее
            <ArrowRight className="size-4" />
          </Button>

          {!isFull && hasSources && (
            <span className="ml-1 font-mono text-[11px] text-muted-foreground">
              · {event.sources!.length} источн.
            </span>
          )}

          <button
            type="button"
            onClick={copyLink}
            aria-label="Скопировать ссылку на событие"
            className="ml-auto inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
          >
            {copied ? (
              <>
                <Check className="size-3.5 text-accent" />
                Скопировано
              </>
            ) : (
              <>
                <Link2 className="size-3.5" />
                Поделиться
              </>
            )}
          </button>
        </div>
      </div>
    </motion.article>
  );
}

export const TimelineEventCard = memo(TimelineEventCardImpl);
