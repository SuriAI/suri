import React, { useState, useEffect } from 'react';
import { backendService } from '../services/BackendService';
import { attendanceManager } from '../services/AttendanceManager';
import type { AttendanceGroup } from '../types/recognition';

export interface QuickSettings {
  showFPS: boolean;
  showPreprocessing: boolean;
  showBoundingBoxes: boolean;
  showLandmarks: boolean;
  showAntiSpoofStatus: boolean;
  showRecognitionNames: boolean;
  showDebugInfo: boolean;
}

interface SettingsOverview {
  totalPersons: number;
  totalEmbeddings: number;
  lastUpdated: string;
}

interface SettingsProps {
  onBack: () => void;
  isModal?: boolean;
  quickSettings?: QuickSettings;
  onQuickSettingsChange?: (settings: QuickSettings) => void;
  attendanceGroup?: AttendanceGroup;
  onAttendanceGroupUpdate?: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ 
  onBack, 
  isModal = false, 
  quickSettings: externalQuickSettings, 
  onQuickSettingsChange,
  attendanceGroup,
  onAttendanceGroupUpdate
}) => {
  const [expandedSection, setExpandedSection] = useState<string>('display');
  const [systemData, setSystemData] = useState<SettingsOverview>({
    totalPersons: 0,
    totalEmbeddings: 0,
    lastUpdated: new Date().toISOString()
  });
  const [isLoading, setIsLoading] = useState(false);
  const [localAttendanceGroup, setLocalAttendanceGroup] = useState<AttendanceGroup | null>(attendanceGroup || null);

  const [internalQuickSettings, setInternalQuickSettings] = useState<QuickSettings>({
    showFPS: true,
    showPreprocessing: false,
    showBoundingBoxes: true,
    showLandmarks: false,
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

  useEffect(() => {
    if (attendanceGroup) {
      setLocalAttendanceGroup(attendanceGroup);
    }
  }, [attendanceGroup]);

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
    } catch (error) {
      console.error('Failed to clear database:', error);
      alert('Failed to clear database. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateAttendance = async (field: 'class_start_time' | 'late_threshold_minutes', value: string | number) => {
    if (!localAttendanceGroup) return;
                  try {
                    await attendanceManager.updateGroup(localAttendanceGroup.id, {
        settings: { ...localAttendanceGroup.settings, [field]: value }
                    });
                    const updatedGroup = await attendanceManager.getGroup(localAttendanceGroup.id);
                    if (updatedGroup) {
                      setLocalAttendanceGroup(updatedGroup);
                      onAttendanceGroupUpdate?.();
                    }
                  } catch (err) {
      console.error('Update failed:', err);
    }
  };

  const mainContent = (
    <div className={isModal ? "w-full p-6" : "min-h-screen bg-gradient-to-b from-black via-[#050505] to-black p-6"}>
      <div className={isModal ? "w-full" : "max-w-4xl mx-auto"}>
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={onBack} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 hover:text-white transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" strokeWidth={2}/></svg>
            {!isModal && "Back"}
            </button>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-lg border border-emerald-500/20 bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-transparent text-xs text-emerald-100 font-mono">{systemData.totalPersons} people</div>
            <div className="px-3 py-1.5 rounded-lg border border-blue-500/20 bg-gradient-to-br from-blue-500/20 via-blue-500/10 to-transparent text-xs text-blue-100 font-mono">{systemData.totalEmbeddings} embeddings</div>
          </div>
        </div>

        {/* Display Section */}
        <div className="mb-4">
        <button
            onClick={() => setExpandedSection(expandedSection === 'display' ? '' : 'display')}
            className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all mb-3"
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth={1.5}/></svg>
              <span className="text-white font-light">Display</span>
            </div>
            <svg className={`w-5 h-5 text-white/40 transition-transform ${expandedSection === 'display' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" strokeWidth={2}/></svg>
                          </button>
          {expandedSection === 'display' && (
            <div className="grid grid-cols-3 gap-2 px-1">
              {[
                { key: 'showFPS' as keyof QuickSettings, icon: '⚡', label: 'FPS' },
                { key: 'showBoundingBoxes' as keyof QuickSettings, icon: '▢', label: 'Boxes' },
                { key: 'showLandmarks' as keyof QuickSettings, icon: '●', label: 'Landmarks' },
                { key: 'showAntiSpoofStatus' as keyof QuickSettings, icon: '🛡️', label: 'Anti-Spoof' },
                { key: 'showRecognitionNames' as keyof QuickSettings, icon: '👤', label: 'Names' },
                { key: 'showDebugInfo' as keyof QuickSettings, icon: '🔧', label: 'Debug' },
              ].map(({ key, icon, label }) => (
                          <button
                  key={key}
                  onClick={() => toggleQuickSetting(key)}
                  className={`p-3 rounded-xl border transition-all ${
                    quickSettings[key]
                      ? 'bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-transparent border-emerald-500/20'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="text-2xl mb-1">{icon}</div>
                  <div className={`text-xs ${quickSettings[key] ? 'text-emerald-100' : 'text-white/60'}`}>{label}</div>
                  <div className={`w-full h-1 rounded-full mt-2 ${quickSettings[key] ? 'bg-emerald-500/60' : 'bg-white/10'}`}/>
                        </button>
              ))}
            </div>
          )}
        </div>

        {/* Face Database Section */}
        <div className="mb-4">
        <button
            onClick={() => setExpandedSection(expandedSection === 'database' ? '' : 'database')}
            className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all mb-3"
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" strokeWidth={1.5}/></svg>
              <span className="text-white font-light">Face Database</span>
            </div>
            <svg className={`w-5 h-5 text-white/40 transition-transform ${expandedSection === 'database' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" strokeWidth={2}/></svg>
        </button>
          {expandedSection === 'database' && (
            <div className="space-y-3 px-1">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-500/20 via-purple-500/10 to-transparent">
                  <div className="text-xs text-purple-200/60 mb-1">Registered Faces</div>
                  <div className="text-2xl font-light text-purple-100">{systemData.totalPersons}</div>
      </div>
                <div className="p-3 rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/20 via-cyan-500/10 to-transparent">
                  <div className="text-xs text-cyan-200/60 mb-1">Total Embeddings</div>
                  <div className="text-2xl font-light text-cyan-100">{systemData.totalEmbeddings}</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="text-xs text-white/60 mb-2">Average embeddings per face</div>
                <div className="text-lg text-white font-light">
                  {systemData.totalPersons > 0 
                    ? (systemData.totalEmbeddings / systemData.totalPersons).toFixed(1)
                    : '0'}
                </div>
                <div className="mt-2 text-xs text-white/40">
                  Recommended: 3-5 embeddings per person for best accuracy
          </div>
        </div>

              <div className="space-y-2">
                <div className="text-xs text-white/60 mb-2">Database Maintenance</div>
          <button
                  onClick={() => loadSystemData()} 
              disabled={isLoading}
                  className="w-full px-3 py-2 rounded-lg bg-blue-500/20 border border-blue-400/40 text-blue-100 hover:bg-blue-500/30 text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" strokeWidth={2}/></svg>
                  Refresh Stats
            </button>
            <button
                  onClick={handleClearDatabase} 
              disabled={isLoading}
                  className="w-full px-3 py-2 rounded-lg bg-rose-500/20 border border-rose-400/40 text-rose-100 hover:bg-rose-500/30 text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" strokeWidth={2}/></svg>
                  Clear All Face Data
            </button>
        </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" strokeWidth={2}/></svg>
                  <div className="text-xs text-amber-200/80">
                    This clears the face recognition database. To manage people in attendance groups, use the Menu.
          </div>
        </div>
            </div>
            </div>
          )}
        </div>

        {/* Attendance Section */}
        {localAttendanceGroup && (
          <div className="mb-4">
            <button
              onClick={() => setExpandedSection(expandedSection === 'attendance' ? '' : 'attendance')}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all mb-3"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" strokeWidth={1.5}/></svg>
                <span className="text-white font-light">Attendance</span>
              </div>
              <svg className={`w-5 h-5 text-white/40 transition-transform ${expandedSection === 'attendance' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" strokeWidth={2}/></svg>
            </button>
            {expandedSection === 'attendance' && (
              <div className="space-y-4 px-1">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white/60 text-sm">Start Time</span>
                    <span className="text-white font-mono text-sm">{localAttendanceGroup.settings?.class_start_time ?? '08:00'}</span>
        </div>
                  <input
                    type="time"
                    value={localAttendanceGroup.settings?.class_start_time ?? '08:00'}
                    onChange={(e) => updateAttendance('class_start_time', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-blue-500/60"
                  />
              </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white/60 text-sm">Late Threshold</span>
                    <span className="text-white font-medium text-sm">{localAttendanceGroup.settings?.late_threshold_minutes ?? 15}min</span>
            </div>
                  <input
                    type="range"
                    min="5"
                    max="60"
                    step="5"
                    value={localAttendanceGroup.settings?.late_threshold_minutes ?? 15}
                    onChange={(e) => updateAttendance('late_threshold_minutes', parseInt(e.target.value))}
                    className="w-full accent-amber-500"
                  />
        </div>
              </div>
            )}
          </div>
        )}
        
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur flex items-center justify-center z-50">
        <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-[0_40px_80px_rgba(0,0,0,0.6)]">
          {mainContent}
        </div>
      </div>
    );
  }

  return mainContent;
};
