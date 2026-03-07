import { useState, useMemo, useEffect } from "react";
import { attendanceManager } from "@/services/AttendanceManager";
import { Modal } from "@/components/common";
import { Tooltip } from "@/components/shared";
import { useAttendanceStore } from "@/components/main/stores";
import type {
  AttendanceMember,
  AttendanceGroup,
} from "@/components/main/types";

interface ManualEntryModalProps {
  onClose: () => void;
  onSuccess: () => void;
  members: AttendanceMember[];
  presentPersonIds: Set<string>;
  onAddMember: () => void;
  currentGroup?: AttendanceGroup | null;
}

export const ManualEntryModal = ({
  onClose,
  onSuccess,
  members,
  presentPersonIds,
  onAddMember,
  currentGroup,
}: ManualEntryModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [faceDataMap, setFaceDataMap] = useState<Map<string, boolean>>(
    new Map(),
  );

  useEffect(() => {
    if (!currentGroup?.id) return;
    attendanceManager
      .getGroupPersons(currentGroup.id)
      .then((persons: AttendanceMember[]) => {
        const map = new Map<string, boolean>();
        persons.forEach((p) => map.set(p.person_id, p.has_face_data ?? false));
        setFaceDataMap(map);
      })
      .catch(() => {});
  }, [currentGroup?.id]);

  const sortedAllMembers = useMemo(() => {
    return members
      .filter((m) => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [members, searchQuery]);

  const noFaceCount = useMemo(() => {
    return sortedAllMembers.filter(
      (m) => faceDataMap.size > 0 && !faceDataMap.get(m.person_id),
    ).length;
  }, [sortedAllMembers, faceDataMap]);

  const handleManualEntry = async (personId: string) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmittingId(personId);
    setError(null);

    try {
      const record = await attendanceManager.addRecord({
        person_id: personId,
        timestamp: new Date(),
        is_manual: true,
        notes: "Manual entry by admin",
      });

      const store = useAttendanceStore.getState();
      store.setRecentAttendance([record, ...store.recentAttendance]);

      onSuccess();
      onClose();
    } catch (err) {
      setError("Failed to add record. Please try again.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
      setSubmittingId(null);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={
        <div className="flex flex-col -mt-0.5">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-users text-cyan-400 text-sm"></i>
            <span className="text-xl font-bold tracking-tight">Members</span>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <div className="px-2.5 py-1 rounded-full bg-white/5 border border-white/5 text-[11px] font-bold text-white/45">
              {members.length} Total
            </div>
            <div className="px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/10 text-[11px] font-bold text-cyan-400">
              {presentPersonIds.size} Present
            </div>
            {noFaceCount > 0 && (
              <div className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/10 text-[11px] font-bold text-amber-500/80">
                {noFaceCount} Unregistered
              </div>
            )}
          </div>
        </div>
      }
      maxWidth="sm"
    >
      <div className="space-y-4">
        {/* Search & Add Header */}
        <div className="flex items-center mt-2">
          <div className="relative group/search flex-1">
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-[11px] text-white/35 group-focus-within/search:text-cyan-400 transition-colors"></i>
            <input
              type="text"
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 bg-white/5 border border-r-0 border-white/10 rounded-l-lg rounded-r-none pl-9 pr-4 text-[11px] font-medium text-white placeholder:text-white/25 outline-none transition-all duration-300 focus:bg-white/10 focus:border-white/20"
            />
          </div>
          <Tooltip content="Add member" position="top">
            <button
              onClick={() => {
                onClose();
                onAddMember();
              }}
              className="shrink-0 w-9 h-9 flex items-center justify-center rounded-l-none rounded-r-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-white/50 hover:text-white group/add focus:outline-none"
            >
              <i className="fa-solid fa-plus text-xs group-hover/add:scale-110 transition-transform"></i>
            </button>
          </Tooltip>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-[11px] font-bold flex items-center gap-2">
            <i className="fa-solid fa-circle-exclamation text-[10px]"></i>
            {error}
          </div>
        )}

        {sortedAllMembers.length > 0 ? (
          <div className="rounded-xl overflow-hidden bg-[#080808] border border-white/10">
            <div className="max-h-48 overflow-y-auto custom-scroll">
              {sortedAllMembers.map((member) => {
                const isPresent = presentPersonIds.has(member.person_id);
                const isEntrySubmitting = submittingId === member.person_id;
                const hasFace =
                  faceDataMap.size === 0
                    ? null
                    : (faceDataMap.get(member.person_id) ?? false);

                return (
                  <div
                    key={member.person_id}
                    onClick={() =>
                      !isPresent && handleManualEntry(member.person_id)
                    }
                    className={`flex items-center gap-3 px-4 py-2.5 border-b border-white/5 last:border-0 transition-all group/item ${
                      isPresent
                        ? "opacity-50 grayscale-[0.3] cursor-default bg-white/2"
                        : "hover:bg-white/5 cursor-pointer active:scale-[0.99]"
                    }`}
                  >
                    <span className="flex-1 text-[12px] text-white/70 truncate font-bold group-hover/item:text-white transition-colors">
                      {member.name}
                    </span>

                    <div className="flex items-center gap-2 shrink-0">
                      {isPresent ? (
                        <div className="flex items-center gap-1.5 px-2 py-1">
                          <i className="fa-solid fa-check text-[10px] text-cyan-400"></i>
                          <span className="text-[11px] font-bold text-cyan-400">
                            Present
                          </span>
                        </div>
                      ) : isEntrySubmitting ? (
                        <div className="w-24 flex justify-center">
                          <i className="fa-solid fa-spinner fa-spin text-[10px] text-cyan-400"></i>
                        </div>
                      ) : (
                        <div className="opacity-0 group-hover/item:opacity-100 transition-all flex items-center gap-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider text-cyan-400 active:scale-95">
                          <i className="fa-solid fa-plus text-[8px]"></i>
                          Mark Present
                        </div>
                      )}
                      {!isPresent && hasFace === false && (
                        <div
                          className={`text-[11px] font-bold text-amber-500/40 px-2 py-1 ${isEntrySubmitting || searchQuery ? "hidden" : "group-hover/item:opacity-0"} transition-opacity uppercase tracking-tight`}
                        >
                          Not Registered
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center bg-white/2 rounded-xl border border-white/10 border-dashed">
            <i className="fa-solid fa-user-slash text-white/10 text-xl mb-3"></i>
            <p className="text-[11px] text-white/30 font-bold uppercase tracking-wider">
              No results found
            </p>
          </div>
        )}

        {noFaceCount > 0 && (
          <div className="rounded-xl border border-white/10 bg-[#080808] px-4 py-3 shadow-inner">
            <p className="text-[11px] text-white/35 leading-relaxed font-bold flex items-start gap-3">
              <i className="fa-solid fa-circle-info mt-1 shrink-0 text-amber-500/60 text-[12px]"></i>
              <span className="tracking-tight">
                Members marked{" "}
                <span className="text-amber-500/80">
                  &quot;No face data&quot;
                </span>{" "}
                weren&apos;t registered yet or were imported from another
                device. They must be enrolled on this device to be recognized by
                the camera.
              </span>
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};
