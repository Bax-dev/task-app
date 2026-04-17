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
  primary: string;       // oklch(...) or #hex
  primaryDark: string;   // oklch(...) or #hex
  custom?: boolean;
}

export const THEME_COLORS: ThemeColor[] = [
  { id: 'silver', label: 'Silver', primary: 'oklch(0.45 0.02 240)', primaryDark: 'oklch(0.7 0.012 240)' },
  { id: 'violet', label: 'Violet', primary: 'oklch(0.45 0.31 283)', primaryDark: 'oklch(0.65 0.25 283)' },
  { id: 'blue', label: 'Blue', primary: 'oklch(0.45 0.24 260)', primaryDark: 'oklch(0.65 0.22 260)' },
  { id: 'green', label: 'Green', primary: 'oklch(0.45 0.18 155)', primaryDark: 'oklch(0.65 0.2 155)' },
  { id: 'rose', label: 'Rose', primary: 'oklch(0.5 0.22 10)', primaryDark: 'oklch(0.65 0.22 10)' },
  { id: 'teal', label: 'Teal', primary: 'oklch(0.48 0.15 195)', primaryDark: 'oklch(0.65 0.15 195)' },
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

function sanitizeThemeColorId(themeColorId: string | undefined, customColors: ThemeColor[]) {
  const validIds = new Set([
    ...THEME_COLORS.map((theme) => theme.id),
    ...customColors.map((theme) => theme.id),
  ]);
  return themeColorId && validIds.has(themeColorId) ? themeColorId : 'silver';
}

function isValidHex(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

interface PreferencesState {
  moduleCards: ModuleCard[];
  themeColorId: string;
  customThemeColors: ThemeColor[];
  dueSoonEnabled: boolean;
}

function loadFromStorage(): PreferencesState {
  if (typeof window === 'undefined') {
    return {
      moduleCards: DEFAULT_MODULE_CARDS,
      themeColorId: 'silver',
      customThemeColors: [],
      dueSoonEnabled: true,
    };
  }
  try {
    const saved = localStorage.getItem('taskflow-preferences');
    if (saved) {
      const parsed = JSON.parse(saved);
      const savedIds = new Set(parsed.moduleCards?.map((c: ModuleCard) => c.id) || []);
      const merged = [
        ...(parsed.moduleCards || []),
        ...DEFAULT_MODULE_CARDS.filter((d) => !savedIds.has(d.id)),
      ];
      const customThemeColors: ThemeColor[] = Array.isArray(parsed.customThemeColors)
        ? parsed.customThemeColors.filter(
            (c: any) => c && typeof c.id === 'string' && typeof c.primary === 'string',
          )
        : [];
      return {
        moduleCards: merged,
        themeColorId: sanitizeThemeColorId(parsed.themeColorId, customThemeColors),
        customThemeColors,
        dueSoonEnabled: parsed.dueSoonEnabled ?? true,
      };
    }
  } catch {}
  return {
    moduleCards: DEFAULT_MODULE_CARDS,
    themeColorId: 'silver',
    customThemeColors: [],
    dueSoonEnabled: true,
  };
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
      state.themeColorId = sanitizeThemeColorId(action.payload, state.customThemeColors);
      saveToStorage(state);
    },
    addCustomThemeColor: (state, action: PayloadAction<{ hex: string; label?: string }>) => {
      const { hex, label } = action.payload;
      if (!isValidHex(hex)) return;
      // Dedup by hex (case-insensitive)
      const normalized = hex.toLowerCase();
      if (state.customThemeColors.some((c) => c.primary.toLowerCase() === normalized)) return;
      const id = `custom-${normalized.slice(1)}`;
      const color: ThemeColor = {
        id,
        label: label?.trim() || hex.toUpperCase(),
        primary: normalized,
        primaryDark: normalized,
        custom: true,
      };
      state.customThemeColors.push(color);
      state.themeColorId = id;
      saveToStorage(state);
    },
    removeCustomThemeColor: (state, action: PayloadAction<string>) => {
      state.customThemeColors = state.customThemeColors.filter((c) => c.id !== action.payload);
      if (state.themeColorId === action.payload) {
        state.themeColorId = 'silver';
      }
      saveToStorage(state);
    },
    setDueSoonEnabled: (state, action: PayloadAction<boolean>) => {
      state.dueSoonEnabled = action.payload;
      saveToStorage(state);
    },
    hydratePreferences: (state, action: PayloadAction<Partial<PreferencesState>>) => {
      if (action.payload.customThemeColors !== undefined) {
        state.customThemeColors = action.payload.customThemeColors;
      }
      if (action.payload.themeColorId !== undefined) {
        state.themeColorId = action.payload.themeColorId;
      }
      if (action.payload.moduleCards !== undefined) {
        // Merge: keep server order but backfill any defaults that are missing
        const serverIds = new Set(action.payload.moduleCards.map((c) => c.id));
        state.moduleCards = [
          ...action.payload.moduleCards,
          ...DEFAULT_MODULE_CARDS.filter((d) => !serverIds.has(d.id)),
        ];
      }
      if (action.payload.dueSoonEnabled !== undefined) {
        state.dueSoonEnabled = action.payload.dueSoonEnabled;
      }
      state.themeColorId = sanitizeThemeColorId(state.themeColorId, state.customThemeColors);
      saveToStorage(state);
    },
  },
});

export const {
  renameModuleCard,
  toggleModuleCard,
  reorderModuleCards,
  resetModuleCards,
  setThemeColor,
  addCustomThemeColor,
  removeCustomThemeColor,
  setDueSoonEnabled,
  hydratePreferences,
} = preferencesSlice.actions;

export const selectModuleCards = (state: { preferences: PreferencesState }) =>
  state.preferences.moduleCards;

export const selectVisibleModuleCards = (state: { preferences: PreferencesState }) =>
  state.preferences.moduleCards.filter((c) => c.visible);

export const selectThemeColorId = (state: { preferences: PreferencesState }) =>
  state.preferences.themeColorId;

export const selectCustomThemeColors = (state: { preferences: PreferencesState }) =>
  state.preferences.customThemeColors;

export const selectAllThemeColors = (state: { preferences: PreferencesState }) => [
  ...THEME_COLORS,
  ...state.preferences.customThemeColors,
];

export const selectDueSoonEnabled = (state: { preferences: PreferencesState }) =>
  state.preferences.dueSoonEnabled;

export const selectSyncablePreferences = (state: { preferences: PreferencesState }) => ({
  themeColorId: state.preferences.themeColorId,
  customThemeColors: state.preferences.customThemeColors,
  moduleCards: state.preferences.moduleCards,
  dueSoonEnabled: state.preferences.dueSoonEnabled,
});

export default preferencesSlice.reducer;
