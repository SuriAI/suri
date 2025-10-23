import type { SettingsOverview } from '../types';
import type { AttendanceGroup } from '../../../types/recognition';

interface DatabaseProps {
  systemData: SettingsOverview;
  groups: AttendanceGroup[];
  isLoading: boolean;
  onClearDatabase: () => void;
}

export function Database({ systemData, groups, isLoading, onClearDatabase }: DatabaseProps) {

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-3 border-b border-white/5">
                    <div className="text-sm text-white/70">Total Groups</div>
                    <div className="text-sm font-semibold text-white">{groups.length}</div>
                  </div>
                  
                  <div className="flex items-center justify-between py-3 border-b border-white/5">
                    <div className="text-sm text-white/70">Total Members</div>
                    <div className="text-sm font-semibold text-white">{systemData.totalMembers}</div>
                  </div>
                  
                  <div className="flex items-center justify-between py-3 border-b border-white/5">
                    <div className="text-sm text-white/70">Registered Faces</div>
                    <div className="text-sm font-semibold text-white">{systemData.totalPersons}</div>
                  </div>
                </div>
      </div>

      {/* All Groups Section */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-white/90">All Groups</h3>
          <p className="text-sm text-white/50">Manage attendance groups</p>
        </div>

        <div className="max-h-80 overflow-y-auto custom-scroll">
          {groups.length === 0 ? (
            <div className="text-center py-8 text-white/50">
              <div className="text-sm">No groups found</div>
              <div className="text-xs mt-1">Create groups in the Menu to get started</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2 pr-2">
              {groups.map(group => (
                <div
                  key={group.id}
                  className="rounded-lg p-3 border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate text-white/90">{group.name}</div>
                      {group.description && (
                        <div className="text-xs text-white/50 mt-0.5 truncate">{group.description}</div>
                      )}
                    </div>
                    <div className="text-right ml-4 flex-shrink-0">
                      <div className="text-xs text-white/40">
                        {group.created_at ? new Date(group.created_at).toLocaleDateString() : '—'}
                      </div>
                      <div className="text-xs text-white/30 mt-0.5">
                        ID: {group.id.slice(0, 8)}...
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Clear Database Button */}
      <div className="pt-4">
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

