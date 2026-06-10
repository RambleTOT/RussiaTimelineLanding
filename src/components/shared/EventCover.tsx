import { useState } from 'react';
import { getCategoryByLabel } from '@/lib/categories';
import { getCategoryIcon } from '@/lib/categoryIcons';
import { cn } from '@/lib/utils';
import type { TimelineEvent } from '@/lib/validators';

interface EventCoverProps {
  event: TimelineEvent;
  className?: string;
  /** show the year label on the fallback cover */
  showYear?: boolean;
}

/**
 * Fills its parent (h-full/w-full). Renders the event's web image when present,
 * otherwise a tasteful category-tinted fallback. Gracefully falls back if the
 * remote image fails to load.
 */
export function EventCover({ event, className, showYear = true }: EventCoverProps) {
  const [failed, setFailed] = useState(false);
  const meta = getCategoryByLabel(event.category);
  const Icon = getCategoryIcon(meta.id);
  const hasImage = Boolean(event.image?.url) && !failed;

  if (hasImage) {
    return (
      <img
        src={event.image!.url}
        alt={event.image!.alt ?? event.title}
        loading="lazy"
        onError={() => setFailed(true)}
        className={cn('h-full w-full object-cover', className)}
      />
    );
  }

  return (
    <div
      className={cn('flex h-full w-full flex-col items-center justify-center gap-1.5', className)}
      style={{
        backgroundColor: `${meta.accent}12`,
        backgroundImage: `radial-gradient(120% 120% at 50% 0%, ${meta.accent}22, transparent 70%)`,
      }}
      aria-hidden
    >
      <Icon className="size-5 opacity-90" style={{ color: meta.accent }} />
      {showYear && (
        <span className="text-xs font-semibold tabular-nums" style={{ color: meta.accent }}>
          {event.year}
        </span>
      )}
    </div>
  );
}
