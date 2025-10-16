import type { AttendanceGroup, GroupType } from '../types';
import { FormInput } from '../../common/FormInput';
import { getGroupTypeIcon } from '../utils/overlayRenderer';

interface GroupManagementModalProps {
  showGroupManagement: boolean;
  setShowGroupManagement: (show: boolean) => void;
  attendanceGroups: AttendanceGroup[];
  currentGroup: AttendanceGroup | null;
  newGroupName: string;
  setNewGroupName: (name: string) => void;
  newGroupType: GroupType;
  setNewGroupType: (type: GroupType) => void;
  handleCreateGroup: () => void;
  handleSelectGroup: (group: AttendanceGroup) => void;
  handleDeleteGroup: (group: AttendanceGroup) => void;
}

export function GroupManagementModal({
  showGroupManagement,
  setShowGroupManagement,
  attendanceGroups,
  currentGroup,
  newGroupName,
  setNewGroupName,
  newGroupType,
  setNewGroupType,
  handleCreateGroup,
  handleSelectGroup,
  handleDeleteGroup,
}: GroupManagementModalProps) {
  if (!showGroupManagement) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur flex items-center justify-center z-50 px-4">
      <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl p-6 w-full max-w-lg shadow-[0_40px_80px_rgba(0,0,0,0.6)]">
        <h3 className="text-xl font-semibold mb-2 text-white">Group Management</h3>
        <p className="text-sm text-white/60 mb-4">Create and manage attendance groups</p>

        {/* Create New Group */}
        <div className="mb-6">
          <h4 className="text-lg font-medium mb-3 text-white">Create New Group</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-white/60">Group Name:</label>
              <FormInput
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Enter group name"
                focusColor="border-emerald-500/60"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-white/60">Group Type:</label>
              <select
                value={newGroupType}
                onChange={(e) => setNewGroupType(e.target.value as GroupType)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-emerald-500/60 text-white"
                style={{ colorScheme: 'dark' }}
              >
                <option value="general" className="bg-black text-white">General</option>
                <option value="employee" className="bg-black text-white">👔 Employee</option>
                <option value="student" className="bg-black text-white">🎓 Student</option>
                <option value="visitor" className="bg-black text-white">👤 Visitor</option>
              </select>
            </div>
            <button
              onClick={handleCreateGroup}
              disabled={!newGroupName.trim()}
              className="btn-success w-full px-4 py-2 disabled:opacity-50"
            >
              Create Group
            </button>
          </div>
        </div>

        {/* Existing Groups */}
        {attendanceGroups.length > 0 && (
          <div className="mb-4">
            <h4 className="text-lg font-medium mb-3 text-white">Existing Groups</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {attendanceGroups.map(group => (
                <div key={group.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg">
                  <div>
                    <span className="font-medium text-white">{getGroupTypeIcon(group.type)} {group.name}</span>
                    <div className="text-sm text-white/60">
                      {group.type} • Members
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleSelectGroup(group)}
                      className={`px-3 py-1 rounded text-sm ${
                        currentGroup?.id === group.id
                          ? 'btn-accent'
                          : 'btn-secondary'
                      }`}
                    >
                      {currentGroup?.id === group.id ? 'Active' : 'Select'}
                    </button>
                    <button
                      onClick={() => handleDeleteGroup(group)}
                      className="btn-error px-3 py-1 text-sm"
                      title="Delete Group"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => setShowGroupManagement(false)}
            className="btn-secondary flex-1 px-4 py-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
