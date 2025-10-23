import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface ThemeState {
  dark: boolean;
}

const initialState: ThemeState = {
  dark: typeof document !== 'undefined' && document.documentElement.classList.contains('dark'),
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setDark(state, action: PayloadAction<boolean>) {
      state.dark = action.payload;
      if (state.dark) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    },
    toggleDark(state) {
      state.dark = !state.dark;
      if (state.dark) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    },
  },
});

export const { setDark, toggleDark } = themeSlice.actions;
export default themeSlice.reducer;
