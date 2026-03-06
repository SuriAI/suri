import { Modal } from "@/components/common";

interface BulkConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  memberCount: number;
}

export function BulkConsentModal({
  isOpen,
  onClose,
  onConfirm,
  memberCount,
}: BulkConsentModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Grant Biometric Consent"
      icon={<i className="fa-solid fa-shield-check text-cyan-400"></i>}
      maxWidth="md"
    >
      <div className="mb-6">
        <p className="text-white mb-4">
          Are you sure you want to grant biometric consent to{" "}
          <strong className="text-cyan-400">{memberCount}</strong> member
          {memberCount !== 1 ? "s" : ""} in this group?
        </p>
        <div className="bg-cyan-900/30 border border-cyan-500/40 rounded-xl p-4">
          <p className="text-cyan-200 text-sm leading-relaxed">
            <strong className="text-cyan-400">Important:</strong> By proceeding,
            you confirm that you have obtained explicit, informed permission
            from these individuals (or their legal representatives) to process
            their biometric data on this device.
          </p>
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all text-sm font-bold uppercase tracking-wider"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 px-4 py-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-200 hover:bg-cyan-500/30 transition-all text-sm font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(34,211,238,0.1)] active:scale-95"
        >
          Grant Consent
        </button>
      </div>
    </Modal>
  );
}
