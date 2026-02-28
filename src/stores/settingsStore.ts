import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "dark" | "light";
export type PanelLayout = "single" | "split";

interface SettingsState {
  theme: Theme;
  claudeCodePath: string;
  defaultWorkDir: string;
  panelLayout: PanelLayout;
  showTokenCount: boolean;
  autoScroll: boolean;
  fontSize: number;

  setTheme: (theme: Theme) => void;
  setClaudeCodePath: (path: string) => void;
  setDefaultWorkDir: (dir: string) => void;
  setPanelLayout: (layout: PanelLayout) => void;
  toggleShowTokenCount: () => void;
  toggleAutoScroll: () => void;
  setFontSize: (size: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: "dark",
      claudeCodePath: "claude",
      defaultWorkDir: "~",
      panelLayout: "single",
      showTokenCount: true,
      autoScroll: true,
      fontSize: 14,

      setTheme: (theme) => {
        document.documentElement.setAttribute("data-theme", theme);
        set({ theme });
      },
      setClaudeCodePath: (claudeCodePath) => set({ claudeCodePath }),
      setDefaultWorkDir: (defaultWorkDir) => set({ defaultWorkDir }),
      setPanelLayout: (panelLayout) => set({ panelLayout }),
      toggleShowTokenCount: () => set((s) => ({ showTokenCount: !s.showTokenCount })),
      toggleAutoScroll: () => set((s) => ({ autoScroll: !s.autoScroll })),
      setFontSize: (fontSize) => set({ fontSize }),
    }),
    { name: "prism-settings" }
  )
);
