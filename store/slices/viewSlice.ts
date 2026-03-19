import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type ViewMode = 'grid' | 'list';

interface ViewState {
  views: Record<string, ViewMode>;
}

const initialState: ViewState = {
  views: {},
};

const viewSlice = createSlice({
  name: 'view',
  initialState,
  reducers: {
    setView: (state, action: PayloadAction<{ page: string; mode: ViewMode }>) => {
      state.views[action.payload.page] = action.payload.mode;
    },
  },
});

export const { setView } = viewSlice.actions;

export const selectView = (page: string) => (state: { view: ViewState }): ViewMode =>
  state.view.views[page] || 'grid';

export default viewSlice.reducer;
