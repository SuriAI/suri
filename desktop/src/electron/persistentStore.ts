import Store from "electron-store";
import type { QuickSettings } from "../components/settings/types.js";

// Define the persistent settings schema
export interface PersistentSettingsSchema {
  // Display Settings (QuickSettings)
  quickSettings: QuickSettings;

  // Attendance Settings
  attendance: {
    enableSpoofDetection: boolean;
    trackingMode: "auto" | "manual";
    lateThresholdEnabled: boolean;
    lateThresholdMinutes: number;
    classStartTime: string;
    attendanceCooldownSeconds: number;
  };

  // UI State
  ui: {
    sidebarCollapsed: boolean;
    sidebarWidth: number;
    selectedGroupId: string | null;
    groupSidebarCollapsed: boolean;
    selectedCamera: string;
  };

  // Report Views (per group)
  reportViews: Record<string, unknown>;
  reportDefaultViewNames: Record<string, string>;
}

// Default values (exported for reuse in service)
export const defaultSettings: PersistentSettingsSchema = {
  quickSettings: {
    showFPS: false,
    showPreprocessing: false,
    showBoundingBoxes: true,
    showLandmarks: true,
    showRecognitionNames: true,
    cameraMirrored: true,
  },
  attendance: {
    enableSpoofDetection: true,
    trackingMode: "auto",
    lateThresholdEnabled: false,
    lateThresholdMinutes: 5,
    classStartTime: "08:00",
    attendanceCooldownSeconds: 10,
  },
  ui: {
    sidebarCollapsed: false,
    sidebarWidth: 320,
    selectedGroupId: null,
    groupSidebarCollapsed: false,
    selectedCamera: "",
  },
  reportViews: {},
  reportDefaultViewNames: {},
};

// Create the persistent store instance (electron-store)
export const persistentStore = new Store<PersistentSettingsSchema>({
  name: "config",
  defaults: defaultSettings,
});
