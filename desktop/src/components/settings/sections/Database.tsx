import type { SettingsOverview } from '../types';

interface DatabaseProps {
  systemData: SettingsOverview;
  isLoading: boolean;
  onRefresh: () => void;
  onClearDatabase: () => void;
}

export function Database({ systemData, isLoading, onRefresh, onClearDatabase }: DatabaseProps) {
  const averageEmbeddings = systemData.totalPersons > 0 
    ? (systemData.totalEmbeddings / systemData.totalPersons).toFixed(1)
    : '0';

  return (
    <div className="space-y-8 max-w-2xl">
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

      {/* Maintenance Section */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-white/90">Database Maintenance</h3>
          <p className="text-sm text-white/50">Manage and maintain the face recognition database</p>
        </div>

        <div className="space-y-2">
          <button
            onClick={onRefresh} 
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium text-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" strokeWidth={2}/>
            </svg>
            Refresh Statistics
          </button>
          
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

        <div className="mt-4 p-3 rounded-md bg-amber-500/5 border border-amber-500/20">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" strokeWidth={2}/>
            </svg>
            <div className="text-xs text-amber-200/80">
              This clears the face recognition database. To manage people in attendance groups, use the Menu.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

