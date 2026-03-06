import { useState } from "react";
import { attendanceManager } from "@/services";
import type { AttendanceMember } from "@/types/recognition";
import { Modal } from "@/components/common";

interface EditMemberProps {
  member: AttendanceMember;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditMember({ member, onClose, onSuccess }: EditMemberProps) {
  const [name, setName] = useState(member.name);
  const [role, setRole] = useState(member.role || "");
  const [hasBiometricConsent, setHasBiometricConsent] = useState(
    member.has_consent || false,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim()) {
      return;
    }

    setLoading(true);
    try {
      const updates: Partial<AttendanceMember> = {
        name: name.trim(),
        role: role.trim() || undefined,
        has_consent: hasBiometricConsent,
      };

      await attendanceManager.updateMember(member.person_id, updates);
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Error updating member:", err);
      setError(err instanceof Error ? err.message : "Failed to update member");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={
        <div>
          <h3 className="text-xl font-semibold mb-2">Edit Member</h3>
          <p className="text-sm text-white/60 font-normal">
            Update member details and role
          </p>
        </div>
      }
      maxWidth="lg"
    >
      <div className="mt-2">
        {error && (
          <div className="mb-4 px-4 py-2 bg-red-600/20 border border-red-500/40 text-red-200 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="grid gap-4">
          <label className="text-sm">
            <span className="text-white/60 block mb-2">Full name *</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-cyan-500/60 transition-colors"
              placeholder="Enter full name"
            />
          </label>
          <label className="text-sm">
            <span className="text-white/60 block mb-2">Role (optional)</span>
            <input
              type="text"
              value={role}
              onChange={(event) => setRole(event.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-cyan-500/60 transition-colors"
              placeholder="e.g. Staff, Student, Teacher"
            />
          </label>

          {/* Consent Toggle */}
          <div
            className={`rounded-xl border transition-all duration-300 ${
              hasBiometricConsent
                ? "bg-white/3 border-cyan-500/20"
                : "bg-white/2 border-white/5"
            }`}
          >
            <label className="flex items-start gap-4 p-4 cursor-pointer group">
              <div className="relative flex items-center justify-center mt-0.5 shrink-0">
                <input
                  type="checkbox"
                  checked={hasBiometricConsent}
                  onChange={(e) => setHasBiometricConsent(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="h-5 w-5 rounded-md border border-white/20 bg-white/5 transition-all duration-200 peer-checked:border-cyan-500 peer-checked:bg-cyan-500/10 group-hover:border-white/40" />
                <i className="fa-solid fa-check absolute text-[9px] text-cyan-400 opacity-0 transition-all duration-200 peer-checked:opacity-100" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-sm font-semibold text-white/90 tracking-tight">
                    I confirm that this member has provided informed biometric
                    consent.
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-white/40 group-hover:text-white/60 transition-colors">
                  Facial features are encrypted and stored strictly on this
                  device. Suri does not upload biometric data to the cloud.
                </p>
              </div>
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={handleSave}
            disabled={!name.trim() || loading}
            className="w-full px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-100 hover:bg-cyan-500/30 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {loading ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
