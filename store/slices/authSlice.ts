import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { User, AuthState } from '@/types/auth';
import { apiSlice } from '../api';

const initialState: AuthState = {
  user: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    clearUser: (state) => {
      state.user = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(apiSlice.endpoints.getMe.matchFulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addMatcher(apiSlice.endpoints.login.matchFulfilled, (state, action) => {
        state.user = action.payload.user;
      })
      .addMatcher(apiSlice.endpoints.register.matchFulfilled, (state, action) => {
        state.user = action.payload.user;
      })
      .addMatcher(apiSlice.endpoints.logout.matchFulfilled, (state) => {
        state.user = null;
      })
      .addMatcher(apiSlice.endpoints.updateProfile.matchFulfilled, (state, action) => {
        state.user = action.payload;
      });
  },
});

export const { setUser, clearUser } = authSlice.actions;
export default authSlice.reducer;
