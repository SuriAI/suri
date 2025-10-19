import React, { useState, useEffect } from 'react';
import { backendService } from '../../services/BackendService';
import { Display } from './sections/Display';
import { Database } from './sections/Database';
import type { QuickSettings, SettingsOverview } from './types';

// Re-export QuickSettings for backward compatibility
export type { QuickSettings };

interface SettingsProps {
  onBack: () => void;
  isModal?: boolean;
  quickSettings?: QuickSettings;
  onQuickSettingsChange?: (settings: QuickSettings) => void;
}

export const Settings: React.FC<SettingsProps> = ({ 
  onBack, 
  isModal = false, 
  quickSettings: externalQuickSettings, 
  onQuickSettingsChange
}) => {
  const [activeSection, setActiveSection] = useState<string>('display');
  const [systemData, setSystemData] = useState<SettingsOverview>({
    totalPersons: 0,
    totalEmbeddings: 0,
    lastUpdated: new Date().toISOString()
  });
  const [isLoading, setIsLoading] = useState(false);

  const [internalQuickSettings, setInternalQuickSettings] = useState<QuickSettings>({
    showFPS: true,
    showPreprocessing: false,
    showBoundingBoxes: true,
    showAntiSpoofStatus: true,
    showRecognitionNames: true,
    showDebugInfo: false,
  });

  const quickSettings = externalQuickSettings || internalQuickSettings;

  const toggleQuickSetting = (key: keyof QuickSettings) => {
    const newSettings = { ...quickSettings, [key]: !quickSettings[key] };
    if (onQuickSettingsChange) {
      onQuickSettingsChange(newSettings);
    } else {
      setInternalQuickSettings(newSettings);
    }
  };

  useEffect(() => {
    loadSystemData();
  }, []);

  const loadSystemData = async () => {
    setIsLoading(true);
    try {
      const stats = await backendService.getDatabaseStats();
      setSystemData({
        totalPersons: stats.total_persons,
        totalEmbeddings: stats.total_embeddings,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to load system data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearDatabase = async () => {
    if (!window.confirm('⚠️ Clear ALL face recognition data? This will delete all registered faces and embeddings. This cannot be undone.')) return;
    setIsLoading(true);
    try {
      await backendService.clearDatabase();
      await loadSystemData();
      alert('✓ Database cleared successfully');
    } catch (error) {
      console.error('Failed to clear database:', error);
      alert('❌ Failed to clear database');
    } finally {
      setIsLoading(false);
    }
  };

  const sections = [
    { id: 'display', label: 'Display', icon: 'M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
    { id: 'database', label: 'Face Database', icon: 'M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125' },
  ];

  const mainContent = (
    <div className="h-full flex bg-[#0f0f0f] text-white">
      {/* Sidebar Navigation */}
      <div className="w-56 flex-shrink-0 border-r border-white/10 flex flex-col">
        {/* Header */}
        <div className="px-4 py-4 border-b border-white/10">
          <h1 className="text-sm font-semibold uppercase tracking-wider text-white/60">Settings</h1>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 p-2 space-y-0.5">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-all ${
                activeSection === section.id
                  ? 'bg-white/10 text-white'
                  : 'text-white/60 hover:bg-white/5 hover:text-white/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d={section.icon} strokeWidth={2}/>
                </svg>
                {section.label}
              </div>
            </button>
          ))}
        </div>

        {/* Close Button at Bottom */}
        <div className="p-2 border-t border-white/10">
          <button
            onClick={onBack}
            className="w-full px-3 py-2 rounded-md text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white/80 transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" strokeWidth={2}/>
            </svg>
            Close
          </button>
        </div>
      </div>

      {/* Content Panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Section Header */}
        <div className="px-8 py-6 border-b border-white/10">
          <h2 className="text-xl font-semibold">
            {sections.find(s => s.id === activeSection)?.label}
          </h2>
        </div>

        {/* Section Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scroll">
          {activeSection === 'display' && (
            <Display quickSettings={quickSettings} toggleQuickSetting={toggleQuickSetting} />
          )}
          {activeSection === 'database' && (
            <Database 
              systemData={systemData} 
              isLoading={isLoading}
              onRefresh={loadSystemData}
              onClearDatabase={handleClearDatabase}
            />
          )}
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl w-full max-w-5xl h-[85vh] shadow-[0_40px_80px_rgba(0,0,0,0.6)] overflow-hidden">
          {mainContent}
        </div>
      </div>
    );
  }

  return mainContent;
};

