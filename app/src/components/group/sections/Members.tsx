import { useState, useMemo } from "react";
import { attendanceManager } from "../../../services";
import { generateDisplayNames } from "../../../utils";
import type { AttendanceMember } from "../../../types/recognition.js";

interface MembersProps {
  members: AttendanceMember[];
  onMembersChange: () => void;
  onEdit: (member: AttendanceMember) => void;
  onAdd: () => void;
}

export function Members({
  members,
  onMembersChange,
  onEdit,
  onAdd,
}: MembersProps) {
  const [memberSearch, setMemberSearch] = useState("");
  const [registrationFilter, setRegistrationFilter] = useState<
    "all" | "registered" | "non-registered"
  >("all");

  // Generate display names with auto-differentiation for duplicates
  const membersWithDisplayNames = useMemo(() => {
    return generateDisplayNames(members);
  }, [members]);

  const filteredMembers = useMemo(() => {
    let result = membersWithDisplayNames;

    if (memberSearch.trim()) {
      const query = memberSearch.toLowerCase();
      result = result.filter(
        (member) =>
          member.name.toLowerCase().includes(query) ||
          member.displayName.toLowerCase().includes(query) ||
          member.person_id.toLowerCase().includes(query),
      );
    }

    if (registrationFilter !== "all") {
      result = result.filter((member) => {
        const isRegistered = member.has_face_data;
        return registrationFilter === "registered"
          ? isRegistered
          : !isRegistered;
      });
    }

    result = [...result].sort((a, b) => {
      // Sort by registration status first (Unregistered first)
      if (!a.has_face_data && b.has_face_data) return -1;
      if (a.has_face_data && !b.has_face_data) return 1;
      // Then alphabetically
      return a.displayName.localeCompare(b.displayName);
    });

    return result;
  }, [memberSearch, membersWithDisplayNames, registrationFilter]);

  const handleRemoveMember = async (personId: string) => {
    if (!confirm("Remove this member from the group?")) {
      return;
    }

    try {
      await attendanceManager.removeMember(personId);
      onMembersChange();
    } catch (err) {
      console.error("Error removing member:", err);
      alert(err instanceof Error ? err.message : "Failed to remove member");
    }
  };

  if (members.length === 0) {
    return (
      <section className="h-full flex flex-col items-center justify-center p-6 text-center space-y-3">
        <div className="text-white/70 text-sm font-medium">No members yet</div>
        <div className="text-white/40 text-xs max-w-xs">
          Add members first so they can be registered and tracked for attendance.
        </div>
        <button
          onClick={onAdd}
          className="px-4 py-2 text-xs bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.1] rounded text-white/70 hover:text-white/90 transition-colors flex items-center gap-2"
        >
          <i className="fa-solid fa-user-plus text-xs"></i>
          Add Member
        </button>
      </section>
    );
  }

  return (
    <div className="space-y-3 flex flex-col overflow-hidden min-h-0 h-full p-6">
      {/* Search Bar */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="search"
            value={memberSearch}
            onChange={(e) => setMemberSearch(e.target.value)}
            placeholder="Search members..."
            className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-cyan-400/50 focus:bg-white/10 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Filters & Count */}
      <div className="flex items-center justify-between gap-2 flex-shrink-0">
        {members.length > 0 && filteredMembers.length > 0 && (
          <div className="text-xs text-white/30">
            Showing {filteredMembers.length} of {members.length} member
            {members.length !== 1 ? "s" : ""}
          </div>
        )}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => setRegistrationFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${registrationFilter === "all"
              ? "bg-white/10 text-white border border-white/20"
              : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/8 hover:text-white/80"
              }`}
          >
            All
          </button>
          <button
            onClick={() => setRegistrationFilter("non-registered")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${registrationFilter === "non-registered"
              ? "bg-amber-500/20 text-amber-200 border border-amber-500/30"
              : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/8 hover:text-white/80"
              }`}
          >
            Needs Registration
          </button>
          <button
            onClick={() => setRegistrationFilter("registered")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${registrationFilter === "registered"
              ? "bg-cyan-500/20 text-cyan-200 border border-cyan-500/30"
              : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/8 hover:text-white/80"
              }`}
          >
            Registered
          </button>
        </div>
      </div>

      {/* Member List */}
      <div className="flex-1 space-y-1.5 overflow-y-auto custom-scroll overflow-x-hidden min-h-0">
        {filteredMembers.length === 0 && (
          <div className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-6 text-center w-full">
            <div className="text-xs text-white/40">
              {memberSearch.trim()
                ? `No results for "${memberSearch}"`
                : registrationFilter === "registered"
                  ? "No registered members"
                  : registrationFilter === "non-registered"
                    ? "All members are registered"
                    : "No members found"}
            </div>
          </div>
        )}

        {filteredMembers.map((member) => {
          return (
            <div
              key={member.person_id}
              className="group relative w-full rounded-xl border border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/5 px-3 py-3 transition-all flex items-center justify-between gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium text-white truncate">
                    {member.displayName}
                  </div>
                </div>
                {member.role && (
                  <div className="text-xs text-white/40 truncate mt-0.5">
                    {member.role}
                  </div>
                )}
                {member.email && (
                  <div className="text-xs text-white/30 truncate mt-0.5">
                    {member.email}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onEdit(member)}
                    className="p-1.5 rounded-md text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                    title="Edit Member"
                  >
                    <i className="fa-solid fa-pen text-xs"></i>
                  </button>
                  <button
                    onClick={() => handleRemoveMember(member.person_id)}
                    className="p-1.5 rounded-md text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Remove Member"
                  >
                    <i className="fa-solid fa-trash text-xs"></i>
                  </button>
                </div>

                {member.has_face_data ? (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-cyan-500/20 border border-cyan-500/30">
                    <svg
                      className="w-3 h-3 text-cyan-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-xs font-medium text-cyan-300">
                      Registered
                    </span>
                  </span>
                ) : (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-xs font-medium text-amber-500/70">
                    Not Registered
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
