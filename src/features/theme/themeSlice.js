import { createSlice } from "@reduxjs/toolkit";

const savedMode = localStorage.getItem("themeMode");

const initialState = {
  mode: savedMode || "dark", // 'dark' | 'light'
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.mode = state.mode === "dark" ? "light" : "dark";
      localStorage.setItem("themeMode", state.mode);
    },
    setTheme: (state, action) => {
      state.mode = action.payload;
      localStorage.setItem("themeMode", state.mode);
    },
  },
});

export const { toggleTheme, setTheme } = themeSlice.actions;
export default themeSlice.reducer;
