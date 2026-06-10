import { lazy, Suspense } from 'react';
import { Hero } from '@/components/hero/Hero';
import { IntroSection } from '@/components/intro/IntroSection';
import { TimelineSection } from '@/components/timeline/TimelineSection';
import { Footer } from '@/components/layout/Footer';
import { BackgroundDecor } from '@/components/layout/BackgroundDecor';
import { ReadingProgress } from '@/components/layout/ReadingProgress';
import { ScrollToTopButton } from '@/components/shared/ScrollToTopButton';
import { useSmoothScroll } from '@/hooks/use-smooth-scroll';
import { useDeepLink } from '@/hooks/use-deep-link';

// Heavy, interaction-only UI is code-split and only loaded when first opened.
const AskAIModal = lazy(() =>
  import('@/components/ai/AskAIModal').then((m) => ({ default: m.AskAIModal })),
);
const EventDetailDrawer = lazy(() =>
  import('@/components/timeline/EventDetailDrawer').then((m) => ({ default: m.EventDetailDrawer })),
);

export default function App() {
  useSmoothScroll();
  useDeepLink();

  return (
    <>
      {/* fixed decorative atlas layer + grain texture behind content */}
      <BackgroundDecor />
      <div className="noise-layer pointer-events-none fixed inset-0 z-0" aria-hidden />

      <ReadingProgress />

      <main className="relative z-10">
        <Hero />
        <IntroSection />
        <TimelineSection />
        <Footer />
      </main>

      <ScrollToTopButton />

      <Suspense fallback={null}>
        <EventDetailDrawer />
        <AskAIModal />
      </Suspense>
    </>
  );
}
