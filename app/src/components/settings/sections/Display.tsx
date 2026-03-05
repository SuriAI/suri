import { motion, AnimatePresence } from "framer-motion";
import type { QuickSettings } from "@/components/settings/types";

interface DisplayProps {
  quickSettings: QuickSettings;
  toggleQuickSetting: (key: keyof QuickSettings) => void;
}

export function Display({ quickSettings, toggleQuickSetting }: DisplayProps) {
  const settingItems = [
    {
      key: "cameraMirrored" as keyof QuickSettings,
      label: "Camera Mirroring",
      descriptions: {
        on: "ON: Camera is mirrored.",
        off: "OFF: Normal camera view.",
      },
    },
    {
      key: "showFPS" as keyof QuickSettings,
      label: "Performance Info",
      descriptions: {
        on: "ON: Showing real-time FPS counter.",
        off: "OFF: FPS counter is hidden.",
      },
    },
    {
      key: "showRecognitionNames" as keyof QuickSettings,
      label: "Identification Labels",
      descriptions: {
        on: "ON: Member names are shown on the camera feed.",
        off: "OFF: Names are hidden.",
      },
    },
  ];

  return (
    <div className="space-y-4 max-w-auto p-10">
      {settingItems.map(({ key, label, descriptions }) => (
        <div
          key={key}
          className="flex items-center py-3 border-b border-white/5 gap-4"
        >
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white/90">{label}</div>
            <div className="min-h-4 relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${key}-${quickSettings[key]}`}
                  initial={{ opacity: 0, y: -2 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 2 }}
                  transition={{ duration: 0.15 }}
                  className="text-xs text-white/50"
                >
                  {quickSettings[key] ? descriptions.on : descriptions.off}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <button
            onClick={() => toggleQuickSetting(key)}
            className={`relative w-11 h-6 rounded-full focus:outline-none transition-colors duration-150 shrink-0 flex items-center ml-auto ${
              quickSettings[key] ? "bg-cyan-500/30" : "bg-white/10"
            }`}
          >
            <div
              className={`absolute left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-150 ${
                quickSettings[key] ? "translate-x-5" : "translate-x-0"
              }`}
            ></div>
          </button>
        </div>
      ))}
    </div>
  );
}
