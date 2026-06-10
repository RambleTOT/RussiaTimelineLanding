import { useEffect, useRef, useState } from 'react';
import { motion, animate, useInView } from 'framer-motion';
import { ArrowDown, LayoutList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/layout/Container';
import { Eyebrow } from '@/components/layout/Section';
import { CATEGORIES } from '@/lib/categories';
import { STATS } from '@/lib/events-data';
import { scrollToTarget } from '@/lib/smooth-scroll';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useUiStore } from '@/store/ui-store';

const easeOut = [0.16, 1, 0.3, 1] as const;

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: easeOut } },
};

function CountUp({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      setDisplay(value);
      return;
    }
    const controls = animate(0, value, {
      duration: 1.1,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, value, reduced]);

  return <span ref={ref}>{display}</span>;
}

function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-serif text-3xl font-semibold tabular-nums text-foreground sm:text-4xl">
        {value}
      </span>
      <span className="font-mono text-[11px] tracking-normal text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

/** Abstract vertical timeline spine with shimmering category dots. */
function HeroSpine() {
  return (
    <div
      className="relative hidden h-[460px] w-full max-w-[260px] lg:block"
      aria-hidden
    >
      {/* base line */}
      <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-foreground/15 to-transparent" />
      {/* animated fill */}
      <motion.div
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 1.6, ease: easeOut, delay: 0.4 }}
        className="absolute left-1/2 top-0 h-full w-px origin-top -translate-x-1/2 bg-gradient-to-b from-primary/0 via-primary/60 to-accent/0"
      />
      {CATEGORIES.map((cat, i) => {
        const top = (i / (CATEGORIES.length - 1)) * 100;
        const side = i % 2 === 0;
        return (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, x: side ? 12 : -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: easeOut, delay: 0.6 + i * 0.1 }}
            className="absolute flex items-center gap-3"
            style={{
              top: `${top}%`,
              [side ? 'right' : 'left']: '50%',
              transform: 'translateY(-50%)',
              flexDirection: side ? 'row-reverse' : 'row',
            }}
          >
            <span
              className="size-2.5 rounded-full ring-4 ring-background animate-pulse-dot"
              style={{
                backgroundColor: cat.accent,
                animationDelay: `${i * 0.3}s`,
              }}
            />
            <span className="font-mono text-[10px] tracking-normal text-muted-foreground/80">
              {cat.short}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}

export function Hero() {
  const setMode = useUiStore((s) => s.setMode);
  const setCategories = useUiStore((s) => s.setCategories);

  const startExploring = () => {
    scrollToTarget('#timeline', { offset: -80 });
  };
  const openAllEvents = () => {
    setMode('all');
    setCategories([]);
    scrollToTarget('#timeline', { offset: -80 });
  };

  return (
    <header className="relative overflow-hidden">
      {/* fine archival grid, fading out toward the bottom */}
      <div className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(125%_95%_at_50%_0%,#000_25%,transparent_70%)] opacity-70" />

      <Container className="relative">
        <div className="grid min-h-[88vh] items-center gap-12 py-24 lg:grid-cols-[1.5fr_1fr]">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="max-w-2xl"
          >
            <motion.div variants={itemVariants}>
              <Eyebrow>Цифровой исторический атлас · 1991–2022</Eyebrow>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="mt-6 font-serif text-5xl font-semibold leading-[1.05] tracking-tight text-balance sm:text-6xl xl:text-7xl"
            >
              Россия <span className="text-primary">1991–2022</span>:
              <br />
              линия времени
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground"
            >
              Интерактивная хронология ключевых политических, экономических, культурных и
              общественных событий современной России.
            </motion.p>

            <motion.div variants={itemVariants} className="mt-9 flex flex-wrap gap-3">
              <Button size="lg" onClick={startExploring}>
                Начать исследование
                <ArrowDown className="size-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={openAllEvents}>
                <LayoutList className="size-4" />
                Открыть все события
              </Button>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="mt-14 flex gap-10 border-t border-border/60 pt-8"
            >
              <Stat value={<CountUp value={STATS.total} />} label="событий" />
              <Stat value={<CountUp value={STATS.categories} />} label="категорий" />
              <Stat value="1991–2022" label="годы" />
            </motion.div>
          </motion.div>

          <div className="flex justify-center lg:justify-end">
            <HeroSpine />
          </div>
        </div>
      </Container>

      {/* scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.8 }}
        className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2"
        aria-hidden
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          className="font-mono text-[10px] tracking-normal text-muted-foreground/70"
        >
          Листайте вниз
        </motion.div>
      </motion.div>
    </header>
  );
}
