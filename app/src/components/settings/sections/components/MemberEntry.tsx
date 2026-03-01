import type { AttendanceMember } from "@/types/recognition";
import type {
  EditingMember,
  MemberField,
} from "@/components/settings/sections/types";

interface MemberEntryProps {
  member: AttendanceMember;
  editingMember: EditingMember | null;
  editValue: string;
  savingMember: string | null;
  deletingMember: string | null;
  onStartEditing: (member: AttendanceMember, field: MemberField) => void;
  onEditValueChange: (value: string) => void;
  onSaveEdit: (personId: string, field: MemberField, value: string) => void;
  onCancelEditing: () => void;
  onDeleteMember: (personId: string, name: string) => void;
}

export function MemberEntry({
  member,
  editingMember,
  editValue,
  savingMember,
  deletingMember,
  onStartEditing,
  onEditValueChange,
  onSaveEdit,
  onCancelEditing,
  onDeleteMember,
}: MemberEntryProps) {
  const isEditing = (field: MemberField) =>
    editingMember?.personId === member.person_id &&
    editingMember.field === field;

  const handleKeyDown = (e: React.KeyboardEvent, field: MemberField) => {
    if (e.key === "Enter") {
      onSaveEdit(member.person_id, field, editValue);
    } else if (e.key === "Escape") {
      onCancelEditing();
    }
  };

  return (
    <div className="group/member relative px-3 py-1.5 bg-white/[0.01] hover:bg-white/[0.03] border border-transparent hover:border-white/[0.08] rounded-md transition-all">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0 flex items-center gap-3">
          {/* Name */}
          <div className="shrink-0 font-sans">
            {isEditing("name") ? (
              <input
                type="text"
                value={editValue}
                onChange={(e) => onEditValueChange(e.target.value)}
                onBlur={() => onSaveEdit(member.person_id, "name", editValue)}
                onKeyDown={(e) => handleKeyDown(e, "name")}
                autoFocus
                disabled={savingMember === member.person_id}
                className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[11px] font-bold text-white focus:outline-none focus:border-cyan-400/50 transition-colors h-5"
              />
            ) : (
              <div
                onClick={() => onStartEditing(member, "name")}
                className="text-[11px] font-bold text-white/90 cursor-pointer hover:text-cyan-400 transition-colors truncate"
              >
                {member.name}
              </div>
            )}
          </div>

          <span className="text-[9px] font-black text-white/10 shrink-0 select-none">/</span>

          {/* Role & Email - Combined */}
          <div className="flex-1 min-w-0 flex items-center gap-2">
            {isEditing("role") ? (
              <input
                type="text"
                value={editValue}
                onChange={(e) => onEditValueChange(e.target.value)}
                onBlur={() => onSaveEdit(member.person_id, "role", editValue)}
                onKeyDown={(e) => handleKeyDown(e, "role")}
                autoFocus
                disabled={savingMember === member.person_id}
                placeholder="Role"
                className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] text-white/70 focus:outline-none focus:border-cyan-400/50 transition-colors h-5 max-w-[100px]"
              />
            ) : (
              <div
                onClick={() => onStartEditing(member, "role")}
                className={`text-[10px] cursor-pointer transition-colors truncate ${member.role ? "text-white/60 hover:text-white/80" : "text-white/20 italic hover:text-white/40"
                  }`}
              >
                {member.role || "No role"}
              </div>
            )}

            <span className="text-[9px] font-black text-white/10 shrink-0 select-none">·</span>

            {isEditing("email") ? (
              <input
                type="email"
                value={editValue}
                onChange={(e) => onEditValueChange(e.target.value)}
                onBlur={() => onSaveEdit(member.person_id, "email", editValue)}
                onKeyDown={(e) => handleKeyDown(e, "email")}
                autoFocus
                disabled={savingMember === member.person_id}
                placeholder="Email"
                className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] text-white/70 focus:outline-none focus:border-cyan-400/50 transition-colors h-5 max-w-[150px]"
              />
            ) : (
              <div
                onClick={() => onStartEditing(member, "email")}
                className={`text-[10px] cursor-pointer transition-colors truncate ${member.email ? "text-white/50 hover:text-white/70" : "text-white/20 italic hover:text-white/40"
                  }`}
              >
                {member.email || "No email"}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            {member.has_face_data ? (
              <div className="text-[8px] font-black px-1.5 py-0 border border-cyan-500/20 rounded bg-cyan-500/10 text-cyan-400 uppercase">
                Face
              </div>
            ) : (
              <div className="text-[8px] font-black px-1.5 py-0 border border-amber-500/20 rounded bg-amber-500/10 text-amber-500/60 uppercase">
                Empty
              </div>
            )}

            <button
              onClick={() => onDeleteMember(member.person_id, member.name)}
              disabled={deletingMember === member.person_id}
              className="w-5 h-5 flex items-center justify-center rounded-md text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover/member:opacity-100 disabled:opacity-50"
              title="Delete member"
            >
              <i className={`fa-solid ${deletingMember === member.person_id ? "fa-spinner fa-spin" : "fa-trash-can"} text-[9px]`}></i>
            </button>
          </div>
          {savingMember === member.person_id && (
            <i className="fa-solid fa-spinner fa-spin text-[9px] text-cyan-400/60"></i>
          )}
        </div>
      </div>
    </div>
  );
}
