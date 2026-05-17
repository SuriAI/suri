import type {
  GroupWithMembers,
  EditingMember,
  EditingGroup,
  MemberField,
  GroupField,
} from "@/components/settings/sections/types"
import { MemberEntry } from "@/components/settings/sections/components/MemberEntry"
import { Modal } from "@/components/common/Modal"
import type { AttendanceGroup, AttendanceMember } from "@/types/recognition"

interface GroupEntryProps {
  group: GroupWithMembers
  isExpanded: boolean
  editingGroup: EditingGroup | null
  editingMember: EditingMember | null
  editValue: string
  savingGroup: string | null
  savingMember: string | null
  deletingGroup: string | null
  deletingMember: string | null
  onToggle: (groupId: string) => void
  onStartEditingGroup: (group: AttendanceGroup, field: GroupField) => void
  onStartEditingMember: (member: AttendanceMember, field: MemberField) => void
  onEditValueChange: (value: string) => void
  onSaveGroupEdit: (groupId: string, field: GroupField, value: string) => void
  onSaveMemberEdit: (personId: string, field: MemberField, value: string) => void
  onCancelEditing: () => void
  onDeleteGroup: (groupId: string) => void
  onDeleteMember: (personId: string, name: string) => void
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
  const memberCount = group.members.length
  const registeredCount = group.members.filter((m) => m.has_face_data).length

  const handleGroupKeyDown = (e: React.KeyboardEvent, field: GroupField) => {
    if (e.key === "Enter") {
      onSaveGroupEdit(group.id, field, editValue)
    } else if (e.key === "Escape") {
      onCancelEditing()
    }
  }

  return (
    <div className="group/row flex flex-col bg-transparent transition-colors hover:bg-white/[0.01]">
      {/* Group Header */}
      <div className="flex w-full items-center justify-between px-2 py-3.5 transition-colors">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-5 w-5 shrink-0 items-center justify-center text-white/55 transition-colors group-hover/row:text-white/65">
            <i className="fa-solid fa-users text-[13px]"></i>
          </div>

          <div className="flex min-w-0 flex-col">
            {/* Group Name */}
            {editingGroup?.groupId === group.id && editingGroup.field === "name" ?
              <input
                type="text"
                value={editValue}
                onChange={(e) => onEditValueChange(e.target.value)}
                onBlur={() => onSaveGroupEdit(group.id, "name", editValue)}
                onKeyDown={(e) => handleGroupKeyDown(e, "name")}
                onClick={(e) => e.stopPropagation()}
                autoFocus
                disabled={savingGroup === group.id}
                className="h-6 rounded-md border-0 bg-white/10 px-2 py-0.5 text-[13px] font-semibold text-white transition-all outline-none focus:ring-1 focus:ring-white/20"
              />
            : <div
                onClick={(e) => {
                  e.stopPropagation()
                  onStartEditingGroup(group, "name")
                }}
                className="flex cursor-pointer items-center gap-2 truncate text-[13px] font-semibold text-white/90 transition-colors hover:text-white">
                {group.name}
                {savingGroup === group.id && (
                  <i className="fa-solid fa-spinner fa-spin text-[10px] text-white/55"></i>
                )}
              </div>
            }
            <div className="mt-0.5 hidden truncate font-mono text-[11px] tracking-tight text-white/55 sm:block">
              ID: {group.id}
            </div>
          </div>
        </div>

        <div className="ml-4 flex shrink-0 items-center gap-3">
          <span className="text-[11px] font-medium text-white/55">
            {memberCount} {memberCount === 1 ? "member" : "members"}
          </span>
          {registeredCount > 0 && (
            <span className="rounded-md border border-cyan-500/10 bg-cyan-500/[0.06] px-1.5 py-0.5 text-[10px] font-semibold text-cyan-400/90">
              {registeredCount} Registered
            </span>
          )}

          <button
            onClick={() => onToggle(group.id)}
            title="Edit Group"
            className="ml-1 flex h-8 w-8 items-center justify-center rounded-lg border-0 bg-transparent text-white/55 shadow-none transition-all duration-300 outline-none hover:bg-white/5 hover:text-white focus:outline-none active:scale-95">
            <i className="fa-solid fa-pen text-[11px] opacity-70" />
          </button>
        </div>
      </div>

      {/* Members Modal */}
      <Modal
        isOpen={isExpanded}
        onClose={() => onToggle(group.id)}
        title={`${group.name} Members`}
        headerActions={
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDeleteGroup(group.id)
              onToggle(group.id)
            }}
            disabled={deletingGroup === group.id || deletingGroup === "all"}
            className="flex h-7 items-center justify-center gap-1.5 rounded-md border-0 bg-red-500/10 px-2.5 text-[10px] font-bold tracking-wider text-red-400 uppercase shadow-none transition-all hover:bg-red-500/20 active:scale-95 disabled:opacity-50">
            <i
              className={`fa-solid ${deletingGroup === group.id ? "fa-spinner fa-spin" : "fa-trash-can"} text-[10px]`}></i>
            <span>Delete Group</span>
          </button>
        }
        maxWidth="max-w-3xl">
        <div className="p-1">
          {group.members.length === 0 ?
            <div className="px-4 py-8 text-center text-[12px] text-white/55">
              No members in this group
            </div>
          : <div className="max-h-[60vh] divide-y divide-white/5 overflow-y-auto pr-1">
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
          }
        </div>
      </Modal>
    </div>
  )
}
