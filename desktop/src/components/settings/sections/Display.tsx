import type { QuickSettings } from '../types';

interface DisplayProps {
  quickSettings: QuickSettings;
  toggleQuickSetting: (key: keyof QuickSettings) => void;
}

export function Display({ quickSettings, toggleQuickSetting }: DisplayProps) {
  const settingItems = [
    { 
      key: 'showFPS' as keyof QuickSettings, 
      label: 'Show FPS Counter',
      description: 'Display frames per second on the video feed'
    },
    { 
      key: 'showBoundingBoxes' as keyof QuickSettings, 
      label: 'Show Bounding Boxes',
      description: 'Draw detection boxes around detected faces'
    },
    { 
      key: 'showAntiSpoofStatus' as keyof QuickSettings, 
      label: 'Show Anti-Spoof Status',
      description: 'Display anti-spoofing detection indicators'
    },
    { 
      key: 'showRecognitionNames' as keyof QuickSettings, 
      label: 'Show Recognition Names',
      description: 'Display recognized person names on detection boxes'
    },
    { 
      key: 'showDebugInfo' as keyof QuickSettings, 
      label: 'Show Debug Information',
      description: 'Display technical debugging information'
    },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-white/90">Video Overlay Settings</h3>
        <p className="text-sm text-white/50">Configure what information is displayed on the camera feed</p>
      </div>

      <div className="space-y-4">
        {settingItems.map(({ key, label, description }) => (
          <div key={key} className="flex items-center justify-between py-3 border-b border-white/5 gap-4">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white/90">{label}</div>
              <div className="text-xs text-white/50 mt-0.5">{description}</div>
            </div>
            
            <button
              onClick={() => toggleQuickSetting(key)}
              className={`relative w-11 h-6 rounded-full focus:outline-none transition-colors duration-150 flex-shrink-0 flex items-center ${
                quickSettings[key] ? 'bg-emerald-500/30' : 'bg-white/10'
              }`}
            >
              <div className={`absolute left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-150 ${
                quickSettings[key] ? 'translate-x-5' : 'translate-x-0'
              }`}></div>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

