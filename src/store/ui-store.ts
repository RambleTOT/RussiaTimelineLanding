import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type TimelineMode = 'all' | 'overview';
export type DetailLevel = 'short' | 'full';

interface UiState {
  /** «Все события» vs «Исторический обзор» */
  mode: TimelineMode;
  /** active category ids; empty = all categories shown */
  activeCategories: string[];
  /** free-text search query */
  query: string;
  /** card density — «Кратко / подробно» */
  detailLevel: DetailLevel;

  // transient UI (not persisted)
  detailEventId: string | null;
  askEventId: string | null;

  setMode: (mode: TimelineMode) => void;
  toggleCategory: (id: string) => void;
  setCategories: (ids: string[]) => void;
  clearCategories: () => void;
  setQuery: (query: string) => void;
  setDetailLevel: (level: DetailLevel) => void;
  resetFilters: () => void;

  openDetail: (eventId: string) => void;
  closeDetail: () => void;
  openAsk: (eventId: string) => void;
  closeAsk: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      mode: 'all',
      activeCategories: [],
      query: '',
      detailLevel: 'short',
      detailEventId: null,
      askEventId: null,

      setMode: (mode) => set({ mode }),
      toggleCategory: (id) =>
        set((state) => ({
          activeCategories: state.activeCategories.includes(id)
            ? state.activeCategories.filter((c) => c !== id)
            : [...state.activeCategories, id],
        })),
      setCategories: (ids) => set({ activeCategories: ids }),
      clearCategories: () => set({ activeCategories: [] }),
      setQuery: (query) => set({ query }),
      setDetailLevel: (detailLevel) => set({ detailLevel }),
      resetFilters: () => set({ activeCategories: [], query: '' }),

      openDetail: (detailEventId) => set({ detailEventId }),
      closeDetail: () => set({ detailEventId: null }),
      openAsk: (askEventId) => set({ askEventId }),
      closeAsk: () => set({ askEventId: null }),
    }),
    {
      name: 'rt-ui',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        mode: state.mode,
        activeCategories: state.activeCategories,
        detailLevel: state.detailLevel,
      }),
    },
  ),
);
