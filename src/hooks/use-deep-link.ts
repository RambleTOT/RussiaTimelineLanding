import { useEffect } from 'react';
import { eventAnchorId, eventIdFromAnchor } from '@/lib/format';
import { EVENT_BY_ID, OVERVIEW_IDS } from '@/lib/events-data';
import { scrollToTarget } from '@/lib/smooth-scroll';
import { useUiStore } from '@/store/ui-store';

/**
 * On first load, if the URL contains `#event-<id>`, switch to the right mode,
 * clear category filters so the event is visible, then smooth-scroll to it.
 */
export function useDeepLink(): void {
  useEffect(() => {
    const id = eventIdFromAnchor(window.location.hash);
    if (!id) return;
    const event = EVENT_BY_ID.get(id);
    if (!event) return;

    const { setMode, setCategories } = useUiStore.getState();
    setMode(OVERVIEW_IDS.has(id) ? 'overview' : 'all');
    setCategories([]);

    // Wait for the timeline to render the target card, then scroll to it.
    const timer = window.setTimeout(() => {
      scrollToTarget(`#${eventAnchorId(id)}`, { offset: -120 });
    }, 650);

    return () => window.clearTimeout(timer);
  }, []);
}
