import { useState, useMemo } from "react";
import { attendanceManager } from "@/services";
import { useGroupUIStore } from "@/components/group/stores";
import { generateDisplayNames } from "@/utils";
import type { AttendanceMember } from "@/types/recognition";
import { EmptyState } from "@/components/group/shared/EmptyState";
import { DeleteMemberModal } from "./DeleteMemberModal";
import { BulkConsentModal } from "./BulkConsentModal";

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
    "all" | "registered" | "non-registered" | "no-consent"
  >("all");

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
        if (registrationFilter === "no-consent") {
          return !member.has_consent;
        }
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

  const [memberToDelete, setMemberToDelete] = useState<AttendanceMember | null>(
    null,
  );

  const [isBulkConsentModalOpen, setIsBulkConsentModalOpen] = useState(false);

  const handleBulkConsent = async (confirmedIds: string[]) => {
    try {
      await Promise.all(
        confirmedIds.map((id) =>
          attendanceManager.updateMember(id, {
            has_consent: true,
          }),
        ),
      );
      onMembersChange();
      setIsBulkConsentModalOpen(false);
    } catch (err) {
      console.error("Error updating bulk consent:", err);
    }
  };

  const confirmRemoveMember = async () => {
    if (!memberToDelete) return;

    try {
      await attendanceManager.removeMember(memberToDelete.person_id);
      onMembersChange();
      setMemberToDelete(null);
    } catch (err) {
      console.error("Error removing member:", err);
    }
  };

  if (members.length === 0) {
    return (
      <EmptyState
        title="No members in this group yet"
        action={
          onAdd
            ? {
                label: "Add Member",
                onClick: onAdd,
              }
            : undefined
        }
      />
    );
  }

  return (
    <>
      <div className="relative flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="space-y-3 flex flex-col overflow-hidden min-h-0 flex-1 p-6">
          <div className="flex items-center gap-3 shrink-0">
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
                className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-3 py-3 text-[11px] font-medium text-white placeholder:text-white/30 outline-none transition-all duration-300 focus:border-cyan-500/30 focus:bg-white/10 focus:ring-4 focus:ring-cyan-500/10 shadow-inner"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 shrink-0">
            {members.length > 0 && filteredMembers.length > 0 && (
              <div className="text-xs text-white/30">
                Showing {filteredMembers.length} of {members.length} member
                {members.length !== 1 ? "s" : ""}
              </div>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => setRegistrationFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  registrationFilter === "all"
                    ? "bg-white/10 text-white border border-white/20"
                    : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/8 hover:text-white/80"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setRegistrationFilter("non-registered")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  registrationFilter === "non-registered"
                    ? "bg-amber-500/20 text-amber-200 border border-amber-500/30"
                    : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/8 hover:text-white/80"
                }`}
              >
                Unregistered
              </button>
              <button
                onClick={() => setRegistrationFilter("registered")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  registrationFilter === "registered"
                    ? "bg-cyan-500/20 text-cyan-200 border border-cyan-500/30"
                    : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/8 hover:text-white/80"
                }`}
              >
                Registered
              </button>
              <button
                onClick={() => setRegistrationFilter("no-consent")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  registrationFilter === "no-consent"
                    ? "bg-cyan-500/20 text-cyan-200 border border-cyan-500/30"
                    : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/8 hover:text-white/80"
                }`}
              >
                Needs Consent
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-1.5 overflow-y-auto custom-scroll overflow-x-hidden min-h-0 pb-16">
            {filteredMembers.length === 0 && (
              <div className="rounded-lg border border-white/5 bg-white/5 px-3 py-6 text-center w-full">
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
              const isRegistered = member.has_face_data;
              return (
                <div
                  key={member.person_id}
                  className="group relative w-full rounded-xl border border-white/5 bg-white/5 hover:bg-white/5 px-4 py-4 transition-all duration-300 flex items-center justify-between gap-4 overflow-hidden"
                >
                  <div className="flex-1 min-w-0 relative z-10">
                    <div className="text-[15px] font-bold text-white tracking-tight mb-1">
                      {member.displayName}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      {member.role ? (
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-white/40">
                          <i className="fa-solid fa-briefcase text-[9px]"></i>
                          {member.role}
                        </div>
                      ) : (
                        <div className="text-[11px] font-medium text-white/20 italic">
                          Member
                        </div>
                      )}
                      {member.email && (
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-white/40">
                          <i className="fa-solid fa-envelope text-[9px]"></i>
                          {member.email}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 relative z-10">
                    {!member.has_consent && (
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-m text-red-400/80 text-[11px] font-medium">
                        <i className="fa-solid fa-xmark" />
                        No Consent
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0">
                      <button
                        onClick={() => onEdit(member)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-all"
                        title="Edit"
                      >
                        <i className="fa-solid fa-pen-to-square text-xs"></i>
                      </button>
                      <button
                        onClick={() => setMemberToDelete(member)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title="Delete"
                      >
                        <i className="fa-solid fa-trash-can text-xs"></i>
                      </button>
                    </div>

                    {!isRegistered ? (
                      <button
                        onClick={() => {
                          const jump =
                            useGroupUIStore.getState().jumpToRegistration;
                          jump(member.person_id);
                        }}
                        className="px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium hover:bg-cyan-500/20 hover:border-cyan-500/40 transition-all active:scale-95"
                      >
                        Register
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          const jump =
                            useGroupUIStore.getState().jumpToRegistration;
                          jump(member.person_id);
                        }}
                        className="group/btn relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[9px] font-medium text-white/20 transition-all duration-300 hover:bg-amber-500/10 hover:border-amber-500/30 hover:text-amber-400"
                      >
                        <i className="fa-solid fa-check text-[8px] transition-all duration-300 group-hover/btn:opacity-0 group-hover/btn:scale-75 group-hover/btn:absolute"></i>

                        <i className="fa-solid fa-rotate-right text-[10px] absolute opacity-0 scale-75 transition-all duration-300 group-hover/btn:opacity-100 group-hover/btn:scale-100 group-hover/btn:relative"></i>

                        <span className="transition-all duration-300 group-hover/btn:hidden">
                          Registered
                        </span>
                        <span className="hidden transition-all duration-300 group-hover/btn:inline">
                          Re-register
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Consent banner — premium floating snackbar centered at the bottom */}
        {members.some((m) => !m.has_consent) && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-fit max-w-[90%] pointer-events-none">
            <div className="flex items-center gap-4 text-[11px] font-medium px-4 py-2.5 bg-[#080808] text-white/60 rounded-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.8)] pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-triangle-exclamation text-amber-500/80 shrink-0" />
                <span className="leading-snug whitespace-nowrap">
                  Some members need biometric consent.
                </span>
              </div>
              <div className="w-px h-4 bg-white/5" />
              <button
                onClick={() => setIsBulkConsentModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 text-[10px] font-bold tracking-wide transition-all active:scale-95 whitespace-nowrap border border-white/5"
              >
                Grant all
              </button>
            </div>
          </div>
        )}

        <DeleteMemberModal
          isOpen={!!memberToDelete}
          member={memberToDelete}
          onClose={() => setMemberToDelete(null)}
          onConfirm={confirmRemoveMember}
        />

        <BulkConsentModal
          isOpen={isBulkConsentModalOpen}
          onClose={() => setIsBulkConsentModalOpen(false)}
          onConfirm={handleBulkConsent}
          members={members}
        />
      </div>
    </>
  );
}
