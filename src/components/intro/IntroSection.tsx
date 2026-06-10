import { motion } from 'framer-motion';
import { MousePointerClick, CalendarRange, Sparkles, SlidersHorizontal } from 'lucide-react';
import { Container } from '@/components/layout/Container';
import { Eyebrow } from '@/components/layout/Section';

const FEATURES = [
  {
    icon: MousePointerClick,
    title: 'Листайте линию времени',
    text: 'Прокручивайте страницу вниз — события появляются вдоль вертикальной линии в хронологическом порядке.',
  },
  {
    icon: CalendarRange,
    title: 'Группировка по годам',
    text: 'События сгруппированы по годам и разделены на тематические категории с собственными цветами.',
  },
  {
    icon: Sparkles,
    title: 'Вопрос ИИ по каждому событию',
    text: 'У любого события можно спросить о причинах, последствиях и контексте — ответ формирует ИИ-помощник.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Фильтры и поиск',
    text: 'Включайте и выключайте категории, ищите по названию и переключайтесь между кратким и подробным видом.',
  },
];

export function IntroSection() {
  return (
    <Container className="py-20">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-15% 0px' }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-3xl"
      >
        <Eyebrow>Как читать этот атлас</Eyebrow>
        <h2 className="mt-5 font-serif text-3xl font-semibold leading-tight tracking-tight text-balance sm:text-4xl">
          Тридцать лет истории — как одна непрерывная лента
        </h2>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
          От распада СССР до 2022 года: реформы, кризисы, технологические сдвиги, культура и спорт.
          Каждое событие сопровождается короткой справкой «почему это важно» и возможностью задать
          вопрос ИИ.
        </p>
      </motion.div>

      <div className="mt-14 grid gap-px overflow-hidden rounded-xl border border-border/60 bg-border/40 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-10% 0px' }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: i * 0.06 }}
            className="flex flex-col gap-3 bg-card/80 p-6"
          >
            <feature.icon className="size-5 text-primary" aria-hidden />
            <h3 className="font-serif text-base font-semibold">{feature.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{feature.text}</p>
          </motion.div>
        ))}
      </div>
    </Container>
  );
}
