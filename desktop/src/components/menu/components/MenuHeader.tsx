import type { AttendanceGroup } from '../../../types/recognition';

interface MenuHeaderProps {
  selectedGroup: AttendanceGroup | null;
  groups: AttendanceGroup[];
  onGroupChange: (group: AttendanceGroup | null) => void;
  onCreateGroup: () => void;
  isCollapsed: boolean;
}

export function MenuHeader({
  selectedGroup,
  groups,
  onGroupChange,
  onCreateGroup,
  isCollapsed,
}: MenuHeaderProps) {
  return (
    <div className="px-4 py-4 border-b border-white/10">
      <div className="flex items-center justify-between gap-2">
        {/* Group Selector */}
        {!isCollapsed && (
          <div className="relative flex-1">
            <select
              value={selectedGroup?.id ?? ''}
              onChange={(event) => {
                const group = groups.find((item) => item.id === event.target.value) ?? null;
                onGroupChange(group);
              }}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 pr-8 text-sm text-white focus:outline-none focus:border-white/20 transition-all cursor-pointer h-10 appearance-none"
              style={{ colorScheme: 'dark' }}
            >
              <option value="" className="bg-black text-white">
                Select group…
              </option>
              {groups.map((group) => (
                <option key={group.id} value={group.id} className="bg-black text-white">
                  {group.name}
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
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {/* New Group Button */}
          {!isCollapsed && (
            <button
              onClick={onCreateGroup}
              className="w-10 h-10 hover:bg-white/10 rounded-lg transition-colors flex items-center justify-center"
              aria-label="New Group"
              title="New Group"
            >
              <span className="text-lg">+</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}