import { create } from 'zustand';

type ViewMode = 'grid' | 'list';

interface ViewState {
  views: Record<string, ViewMode>;
  getView: (page: string) => ViewMode;
  setView: (page: string, mode: ViewMode) => void;
}

export const useViewStore = create<ViewState>((set, get) => ({
  views: {},
  getView: (page) => get().views[page] || 'grid',
  setView: (page, mode) =>
    set((state) => ({ views: { ...state.views, [page]: mode } })),
}));
