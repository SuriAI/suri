import type { AttendanceGroup } from '../../../types/recognition';
import type { GroupType } from '../../../types/recognition';

interface MenuHeaderProps {
  selectedGroup: AttendanceGroup | null;
  groups: AttendanceGroup[];
  loading: boolean;
  onGroupChange: (group: AttendanceGroup | null) => void;
  onCreateGroup: () => void;
  onBack: () => void;
}

const getGroupTypeIcon = (type: GroupType): string => {
  switch (type) {
    case 'employee':
      return '👔';
    case 'student':
      return '🎓';
    case 'visitor':
      return '👤';
    case 'general':
    default:
      return '';
  }
};

export function MenuHeader({
  selectedGroup,
  groups,
  loading,
  onGroupChange,
  onCreateGroup,
  onBack,
}: MenuHeaderProps) {
  return (
    <div className="px-6 py-4 border-b border-white/10 glass-card">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold">Menu</h1>
          <div className="h-6 w-px bg-white/10" />
          <div className="relative">
            <select
              value={selectedGroup?.id ?? ''}
              onChange={(event) => {
                const group = groups.find((item) => item.id === event.target.value) ?? null;
                onGroupChange(group);
              }}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 pr-8 text-sm text-white focus:outline-none focus:border-white/20 transition-colors appearance-none cursor-pointer w-full"
              style={{ colorScheme: 'dark' }}
            >
              <option value="" className="bg-black text-white">
                Select group…
              </option>
              {groups.map((group) => (
                <option key={group.id} value={group.id} className="bg-black text-white">
                  {getGroupTypeIcon(group.type)} {group.name}
                </option>
              ))}
            </select>
            {/* Custom dropdown arrow */}
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg
                className="w-3 h-3 text-white/50 transition-colors duration-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {loading && (
            <div className="flex items-center gap-2 text-blue-300 text-xs">
              <span className="h-3 w-3 border-2 border-blue-400/40 border-t-blue-300 rounded-full animate-spin" />
            </div>
          )}
          <button onClick={onCreateGroup} className="btn-success text-xs px-2 py-1">
            New Group
          </button>
          <button onClick={onBack} className="btn-primary text-xs px-2 py-1">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

