import { AnimatePresence, motion } from 'framer-motion';

interface StickyYearMarkerProps {
  year: number | null;
  periodLabel: string;
}

/** Large year that stays pinned in the left gutter and updates while scrolling. */
export function StickyYearMarker({ year, periodLabel }: StickyYearMarkerProps) {
  if (year == null) return null;

  return (
    <div className="select-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={year}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="font-serif text-5xl font-semibold leading-none tabular-nums text-foreground/90">
            {year}
          </div>
          <div className="mt-2 font-mono text-[11px] tracking-normal text-muted-foreground">
            {periodLabel}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
