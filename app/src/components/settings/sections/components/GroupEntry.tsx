import type {
  GroupWithMembers,
  EditingMember,
  EditingGroup,
  MemberField,
  GroupField,
} from "@/components/settings/sections/types";
import { MemberEntry } from "@/components/settings/sections/components/MemberEntry";
import type { AttendanceGroup, AttendanceMember } from "@/types/recognition";

interface GroupEntryProps {
  group: GroupWithMembers;
  isExpanded: boolean;
  editingGroup: EditingGroup | null;
  editingMember: EditingMember | null;
  editValue: string;
  savingGroup: string | null;
  savingMember: string | null;
  deletingGroup: string | null;
  deletingMember: string | null;
  onToggle: (groupId: string) => void;
  onStartEditingGroup: (group: AttendanceGroup, field: GroupField) => void;
  onStartEditingMember: (member: AttendanceMember, field: MemberField) => void;
  onEditValueChange: (value: string) => void;
  onSaveGroupEdit: (groupId: string, field: GroupField, value: string) => void;
  onSaveMemberEdit: (
    personId: string,
    field: MemberField,
    value: string,
  ) => void;
  onCancelEditing: () => void;
  onDeleteGroup: (groupId: string) => void;
  onDeleteMember: (personId: string, name: string) => void;
}

export function GroupEntry({
  group,
  isExpanded,
  editingGroup,
  editingMember,
  editValue,
  savingGroup,
  savingMember,
  deletingGroup,
  deletingMember,
  onToggle,
  onStartEditingGroup,
  onStartEditingMember,
  onEditValueChange,
  onSaveGroupEdit,
  onSaveMemberEdit,
  onCancelEditing,
  onDeleteGroup,
  onDeleteMember,
}: GroupEntryProps) {
  const memberCount = group.members.length;
  const registeredCount = group.members.filter((m) => m.has_face_data).length;

  const handleGroupKeyDown = (e: React.KeyboardEvent, field: GroupField) => {
    if (e.key === "Enter") {
      onSaveGroupEdit(group.id, field, editValue);
    } else if (e.key === "Escape") {
      onCancelEditing();
    }
  };

  return (
    <div className="group/row rounded-lg border border-white/5 bg-white/[0.01] hover:bg-white/5 transition-all overflow-hidden font-sans">
      {/* Group Header */}
      <div
        onClick={() => onToggle(group.id)}
        className="w-full px-3 py-2 flex items-center justify-between cursor-pointer transition-colors"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <i
            className={`fa-solid fa-chevron-right text-[10px] text-white/40 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""} group-hover/row:text-white/70 w-3 text-center`}
          ></i>

          <div className="flex-1 min-w-0 flex items-baseline gap-3">
            {/* Group Name */}
            {editingGroup?.groupId === group.id &&
            editingGroup.field === "name" ? (
              <input
                type="text"
                value={editValue}
                onChange={(e) => onEditValueChange(e.target.value)}
                onBlur={() => onSaveGroupEdit(group.id, "name", editValue)}
                onKeyDown={(e) => handleGroupKeyDown(e, "name")}
                onClick={(e) => e.stopPropagation()}
                autoFocus
                disabled={savingGroup === group.id}
                className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-xs font-bold text-white focus:outline-none focus:border-cyan-400/50 transition-colors h-6"
              />
            ) : (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onStartEditingGroup(group, "name");
                }}
                className="text-xs font-bold text-white hover:text-cyan-400 transition-colors truncate flex items-center gap-2"
              >
                {group.name}
                {savingGroup === group.id && (
                  <i className="fa-solid fa-spinner fa-spin text-[9px] text-cyan-400/50"></i>
                )}
              </div>
            )}

            {/* Combined Metadata / Description */}
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[9px] font-black uppercase tracking-widest text-white/20 shrink-0">
                ·
              </span>

              {editingGroup?.groupId === group.id &&
              editingGroup.field === "description" ? (
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => onEditValueChange(e.target.value)}
                  onBlur={() =>
                    onSaveGroupEdit(group.id, "description", editValue)
                  }
                  onKeyDown={(e) => handleGroupKeyDown(e, "description")}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                  disabled={savingGroup === group.id}
                  placeholder="Description…"
                  className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] text-white/70 focus:outline-none focus:border-cyan-400/50 transition-colors h-5"
                />
              ) : (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartEditingGroup(group, "description");
                  }}
                  className={`text-[10px] transition-colors truncate ${
                    group.description
                      ? "text-white/50 hover:text-white/80"
                      : "text-white/20 italic hover:text-white/40"
                  }`}
                >
                  {group.description || "Add description"}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0 ml-4">
          <div className="flex items-center gap-2.5">
            <div className="text-[9px] font-bold text-white/40 uppercase tracking-tighter">
              {memberCount} {memberCount === 1 ? "Member" : "Members"}
            </div>
            {registeredCount > 0 && (
              <div className="text-[9px] font-black px-1.5 py-0 border border-cyan-500/30 rounded-full bg-cyan-500/10 text-cyan-400 uppercase tracking-widest scale-90">
                {registeredCount} Active
              </div>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteGroup(group.id);
            }}
            disabled={deletingGroup === group.id || deletingGroup === "all"}
            className="w-6 h-6 flex items-center justify-center rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover/row:opacity-100 disabled:opacity-50"
            title="Delete group"
          >
            <i
              className={`fa-solid ${deletingGroup === group.id ? "fa-spinner fa-spin" : "fa-trash-can"} text-[10px]`}
            ></i>
          </button>
        </div>
      </div>

      {/* Members List */}
      {isExpanded && (
        <div className="border-t border-white/5 bg-white/5">
          {group.members.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-white/40">
              No members in this group
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {group.members.map((member) => (
                <MemberEntry
                  key={member.person_id}
                  member={member}
                  editingMember={editingMember}
                  editValue={editValue}
                  savingMember={savingMember}
                  deletingMember={deletingMember}
                  onStartEditing={onStartEditingMember}
                  onEditValueChange={onEditValueChange}
                  onSaveEdit={onSaveMemberEdit}
                  onCancelEditing={onCancelEditing}
                  onDeleteMember={onDeleteMember}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
