import { useState, useMemo } from "react";
import { Modal } from "@/components/common";
import type { AttendanceMember } from "@/types/recognition";

interface BulkConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (memberIds: string[]) => void;
  members: AttendanceMember[];
}

export function BulkConsentModal({
  isOpen,
  onClose,
  onConfirm,
  members,
}: BulkConsentModalProps) {
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  const pendingMembers = useMemo(
    () => members.filter((m) => !m.has_consent),
    [members],
  );

  const allChecked =
    pendingMembers.length > 0 && checkedIds.size === pendingMembers.length;

  const toggle = (id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirm = () => {
    onConfirm(Array.from(checkedIds));
    setCheckedIds(new Set());
  };

  const handleClose = () => {
    setCheckedIds(new Set());
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      icon={<i className="fa-solid fa-shield-check text-cyan-400" />}
      title="Grant Biometric Consent"
      maxWidth="sm"
    >
      <div className="mt-2 flex flex-col gap-4 max-h-[60vh] overflow-y-auto custom-scroll pr-1">
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2.5">
          <p className="text-xs leading-relaxed text-amber-200/80">
            <i className="fa-solid fa-triangle-exclamation mr-1.5" />
            Under the Data Privacy Act and GDPR, biometric consent must be{" "}
            <strong>specific and individual</strong>.
          </p>
        </div>

        <p className="text-xs text-white/50">
          Check each member you have obtained explicit, informed consent from:
        </p>

        <div className="max-h-48 overflow-y-auto custom-scroll space-y-1.5 pr-1">
          {pendingMembers.map((member) => (
            <label
              key={member.person_id}
              className={`flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-all duration-200 ${
                checkedIds.has(member.person_id)
                  ? "border-cyan-500/30 bg-cyan-500/10"
                  : "border-white/8 bg-white/3 hover:border-white/15"
              }`}
            >
              <div className="relative flex items-center justify-center shrink-0">
                <input
                  type="checkbox"
                  checked={checkedIds.has(member.person_id)}
                  onChange={() => toggle(member.person_id)}
                  className="peer sr-only"
                />
                <div className="h-4 w-4 rounded border border-white/20 bg-white/5 transition-all peer-checked:border-cyan-500 peer-checked:bg-cyan-500/20" />
                <i className="fa-solid fa-check absolute text-[8px] text-cyan-400 opacity-0 peer-checked:opacity-100 transition-opacity" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white/90 truncate">
                  {member.name}
                </div>
                {member.role && (
                  <div className="text-[11px] text-white/40 font-medium">
                    {member.role}
                  </div>
                )}
              </div>
            </label>
          ))}
        </div>

        <div className="flex items-center justify-between text-xs text-white/40">
          <span>
            {checkedIds.size} of {pendingMembers.length} confirmed
          </span>
          {!allChecked && pendingMembers.length > 1 && (
            <button
              type="button"
              onClick={() =>
                setCheckedIds(new Set(pendingMembers.map((m) => m.person_id)))
              }
              className="text-white/40 hover:text-white/70 underline transition-colors"
            >
              Select all
            </button>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <button
          type="button"
          onClick={handleClose}
          className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white transition-colors text-xs font-medium"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={checkedIds.size === 0}
          className="px-4 py-1.5 rounded-lg border border-cyan-400/30 bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/25 transition-colors text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Grant Consent ({checkedIds.size})
        </button>
      </div>
    </Modal>
  );
}
