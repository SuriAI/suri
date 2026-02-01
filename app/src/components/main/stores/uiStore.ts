import { create } from "zustand";
import type { QuickSettings } from "@/components/settings";
import type { GroupSection } from "@/components/group";
import { persistentSettings } from "@/services/PersistentSettingsService";

interface UIState {
  // Error state
  error: string | null;

  // Settings UI
  showSettings: boolean;
  isSettingsFullScreen: boolean;
  groupInitialSection: GroupSection | undefined;
  settingsInitialSection: string | undefined;
  hasSeenIntro: boolean;
  isHydrated: boolean;

  // Sidebar state
  sidebarCollapsed: boolean;
  sidebarWidth: number;

  // Quick settings
  quickSettings: QuickSettings;

  // Actions
  setError: (error: string | null) => void;
  setShowSettings: (show: boolean) => void;
  setIsSettingsFullScreen: (fullScreen: boolean) => void;
  setGroupInitialSection: (section: GroupSection | undefined) => void;
  setSettingsInitialSection: (section: string | undefined) => void;
  setHasSeenIntro: (seen: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSidebarWidth: (width: number) => void;
  setQuickSettings: (
    settings: QuickSettings | ((prev: QuickSettings) => QuickSettings),
  ) => void;
  setIsHydrated: (isHydrated: boolean) => void;
}

// Load initial QuickSettings from store
const loadInitialSettings = async () => {
  const quickSettings = await persistentSettings.getQuickSettings();
  const uiState = await persistentSettings.getUIState();
  return {
    quickSettings,
    hasSeenIntro: uiState.hasSeenIntro,
    sidebarCollapsed: uiState.sidebarCollapsed,
    sidebarWidth: uiState.sidebarWidth,
  };
};

export const useUIStore = create<UIState>((set) => ({
  // Initial state
  error: null,
  showSettings: false,
  isSettingsFullScreen: false,
  groupInitialSection: undefined,
  settingsInitialSection: undefined,
  hasSeenIntro: false, // Default to false
  isHydrated: false, // Wait for hydration before rendering decisions

  sidebarCollapsed: false,
  sidebarWidth: 300,

  quickSettings: {
    cameraMirrored: true,
    showFPS: false,
    showRecognitionNames: true,
    showLandmarks: true,
  },

  // Actions
  setError: (error) => set({ error }),
  setShowSettings: (show) => set({ showSettings: show }),
  setIsSettingsFullScreen: (fullScreen) =>
    set({ isSettingsFullScreen: fullScreen }),
  setGroupInitialSection: (section) => set({ groupInitialSection: section }),
  setSettingsInitialSection: (section) =>
    set({ settingsInitialSection: section }),
  setHasSeenIntro: (seen) => {
    set({ hasSeenIntro: seen });
    persistentSettings.setUIState({ hasSeenIntro: seen }).catch(console.error);
  },
  setSidebarCollapsed: (collapsed) => {
    set({ sidebarCollapsed: collapsed });
    persistentSettings
      .setUIState({ sidebarCollapsed: collapsed })
      .catch(console.error);
  },
  setSidebarWidth: (width) => {
    set({ sidebarWidth: width });
    persistentSettings.setUIState({ sidebarWidth: width }).catch(console.error);
  },
  setQuickSettings: (settings) => {
    const newSettings =
      typeof settings === "function"
        ? settings(useUIStore.getState().quickSettings)
        : settings;
    set({ quickSettings: newSettings });
    // Save to store asynchronously (don't block)
    persistentSettings.setQuickSettings(newSettings).catch(console.error);
  },
  setIsHydrated: (isHydrated: boolean) => set({ isHydrated }),
}));

// Load Settings from store on initialization
if (typeof window !== "undefined") {
  loadInitialSettings().then(
    ({ quickSettings, hasSeenIntro, sidebarCollapsed, sidebarWidth }) => {
      useUIStore.setState({
        quickSettings,
        hasSeenIntro,
        sidebarCollapsed: sidebarCollapsed ?? false,
        sidebarWidth: sidebarWidth ?? 300,
        isHydrated: true,
      });
    },
  );
}
