import type { SettingsOverview } from '../types';

interface DatabaseProps {
  systemData: SettingsOverview;
  isLoading: boolean;
  onClearDatabase: () => void;
}

export function Database({ systemData, isLoading, onClearDatabase }: DatabaseProps) {
  const averageEmbeddings = systemData.totalPersons > 0 
    ? (systemData.totalEmbeddings / systemData.totalPersons).toFixed(1)
    : '0';

  return (
    <div className="flex flex-col h-full max-w-2xl">
      {/* Statistics Section */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-white/90">Database Statistics</h3>
          <p className="text-sm text-white/50">Current face recognition database status</p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between py-3 border-b border-white/5">
            <div className="text-sm text-white/70">Registered Faces</div>
            <div className="text-sm font-semibold text-white">{systemData.totalPersons}</div>
          </div>
          
          <div className="flex items-center justify-between py-3 border-b border-white/5">
            <div className="text-sm text-white/70">Total Embeddings</div>
            <div className="text-sm font-semibold text-white">{systemData.totalEmbeddings}</div>
          </div>
          
          <div className="flex items-center justify-between py-3 border-b border-white/5">
            <div className="flex-1">
              <div className="text-sm text-white/70">Average Embeddings per Face</div>
              <div className="text-xs text-white/40 mt-0.5">Recommended: 3-5 for best accuracy</div>
            </div>
            <div className="text-sm font-semibold text-white">{averageEmbeddings}</div>
          </div>
        </div>
      </div>

      {/* Clear Database Button at Bottom */}
      <div className="mt-auto pt-8">
        <button
          onClick={onClearDatabase} 
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-sm font-medium text-red-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" strokeWidth={2}/>
          </svg>
          Clear All Face Data
        </button>
      </div>
    </div>
  );
}

