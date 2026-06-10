import { getCategoryByLabel } from '@/lib/categories';
import { getCategoryIcon } from '@/lib/categoryIcons';
import { cn } from '@/lib/utils';

interface CategoryBadgeProps {
  category: string;
  className?: string;
  withIcon?: boolean;
  compact?: boolean;
}

/** Pill showing a category with its accent colour + icon. */
export function CategoryBadge({
  category,
  className,
  withIcon = true,
  compact = false,
}: CategoryBadgeProps) {
  const meta = getCategoryByLabel(category);
  const Icon = getCategoryIcon(meta.id);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium leading-5',
        className,
      )}
      style={{
        color: meta.accent,
        borderColor: `${meta.accent}40`,
        backgroundColor: `${meta.accent}14`,
      }}
    >
      {withIcon && <Icon className="size-3.5 shrink-0" aria-hidden />}
      {compact ? meta.short : meta.label}
    </span>
  );
}
