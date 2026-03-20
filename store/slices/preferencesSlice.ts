import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ModuleCard {
  id: string;
  name: string;
  href: string;
  icon: string;
  visible: boolean;
}

export interface ThemeColor {
  id: string;
  label: string;
  primary: string;
  primaryDark: string;
}

export const THEME_COLORS: ThemeColor[] = [
  { id: 'violet', label: 'Violet', primary: 'oklch(0.45 0.31 283)', primaryDark: 'oklch(0.65 0.25 283)' },
  { id: 'blue', label: 'Blue', primary: 'oklch(0.45 0.24 260)', primaryDark: 'oklch(0.65 0.22 260)' },
  { id: 'green', label: 'Green', primary: 'oklch(0.45 0.18 155)', primaryDark: 'oklch(0.65 0.2 155)' },
  { id: 'orange', label: 'Orange', primary: 'oklch(0.55 0.22 50)', primaryDark: 'oklch(0.7 0.2 50)' },
  { id: 'rose', label: 'Rose', primary: 'oklch(0.5 0.22 10)', primaryDark: 'oklch(0.65 0.22 10)' },
  { id: 'teal', label: 'Teal', primary: 'oklch(0.48 0.15 195)', primaryDark: 'oklch(0.65 0.15 195)' },
  { id: 'amber', label: 'Amber', primary: 'oklch(0.55 0.2 75)', primaryDark: 'oklch(0.7 0.18 75)' },
  { id: 'slate', label: 'Slate', primary: 'oklch(0.35 0.02 260)', primaryDark: 'oklch(0.6 0.02 260)' },
];

const DEFAULT_MODULE_CARDS: ModuleCard[] = [
  { id: 'tasks', name: 'Tasks', href: '/tasks', icon: 'CheckSquare', visible: true },
  { id: 'calendar', name: 'Calendar', href: '/calendar', icon: 'CalendarDays', visible: true },
  { id: 'notes', name: 'Notes', href: '/notes', icon: 'FileText', visible: true },
  { id: 'reports', name: 'Reports', href: '/reports', icon: 'BarChart3', visible: true },
  { id: 'favorites', name: 'Quick Access', href: '/favorites', icon: 'Star', visible: true },
  { id: 'team', name: 'Team', href: '/team', icon: 'Users', visible: false },
  { id: 'activity', name: 'Activity', href: '/activity-logs', icon: 'Activity', visible: false },
];

interface PreferencesState {
  moduleCards: ModuleCard[];
  themeColorId: string;
}

function loadFromStorage(): PreferencesState {
  if (typeof window === 'undefined') return { moduleCards: DEFAULT_MODULE_CARDS, themeColorId: 'violet' };
  try {
    const saved = localStorage.getItem('taskflow-preferences');
    if (saved) {
      const parsed = JSON.parse(saved);
      const savedIds = new Set(parsed.moduleCards?.map((c: ModuleCard) => c.id) || []);
      const merged = [
        ...(parsed.moduleCards || []),
        ...DEFAULT_MODULE_CARDS.filter((d) => !savedIds.has(d.id)),
      ];
      return {
        moduleCards: merged,
        themeColorId: parsed.themeColorId || 'violet',
      };
    }
  } catch {}
  return { moduleCards: DEFAULT_MODULE_CARDS, themeColorId: 'violet' };
}

function saveToStorage(state: PreferencesState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('taskflow-preferences', JSON.stringify(state));
  } catch {}
}

const initialState: PreferencesState = loadFromStorage();

const preferencesSlice = createSlice({
  name: 'preferences',
  initialState,
  reducers: {
    renameModuleCard: (state, action: PayloadAction<{ id: string; name: string }>) => {
      const card = state.moduleCards.find((c) => c.id === action.payload.id);
      if (card) {
        card.name = action.payload.name;
        saveToStorage(state);
      }
    },
    toggleModuleCard: (state, action: PayloadAction<string>) => {
      const card = state.moduleCards.find((c) => c.id === action.payload);
      if (card) {
        card.visible = !card.visible;
        saveToStorage(state);
      }
    },
    reorderModuleCards: (state, action: PayloadAction<ModuleCard[]>) => {
      state.moduleCards = action.payload;
      saveToStorage(state);
    },
    resetModuleCards: (state) => {
      state.moduleCards = DEFAULT_MODULE_CARDS;
      saveToStorage(state);
    },
    setThemeColor: (state, action: PayloadAction<string>) => {
      state.themeColorId = action.payload;
      saveToStorage(state);
    },
  },
});

export const { renameModuleCard, toggleModuleCard, reorderModuleCards, resetModuleCards, setThemeColor } =
  preferencesSlice.actions;

export const selectModuleCards = (state: { preferences: PreferencesState }) =>
  state.preferences.moduleCards;

export const selectVisibleModuleCards = (state: { preferences: PreferencesState }) =>
  state.preferences.moduleCards.filter((c) => c.visible);

export const selectThemeColorId = (state: { preferences: PreferencesState }) =>
  state.preferences.themeColorId;

export default preferencesSlice.reducer;
