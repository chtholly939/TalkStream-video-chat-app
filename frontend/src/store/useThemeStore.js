import { create } from "zustand";

export const useThemeStore = create((set) => ({
  theme: localStorage.getItem("talkstream-theme") || "coffee",
  setTheme: (theme) => {
    localStorage.setItem("talkstream-theme", theme);
    set({ theme });
  },
}));