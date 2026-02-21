import type { AttendanceGroup } from "@/components/main/types";

interface DeleteConfirmationModalProps {
  showDeleteConfirmation: boolean;
  groupToDelete: AttendanceGroup | null;
  currentGroup: AttendanceGroup | null;
  cancelDeleteGroup: () => void;
  confirmDeleteGroup: () => void;
}

export function DeleteConfirmationModal({
  showDeleteConfirmation,
  groupToDelete,
  currentGroup,
  cancelDeleteGroup,
  confirmDeleteGroup,
}: DeleteConfirmationModalProps) {
  if (!showDeleteConfirmation || !groupToDelete) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4"
      onClick={cancelDeleteGroup}
    >
      <div
        className="bg-[#09090b]/95 border border-white/10 p-6 rounded-xl max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold mb-3 text-red-300 flex items-center gap-2">
          <i className="fa-solid fa-triangle-exclamation"></i>
          Delete group
        </h3>

        <div className="mb-6">
          <p className="text-white/80 text-sm mb-4">
            Are you sure you want to delete the group{" "}
            <strong className="text-white">"{groupToDelete.name}"</strong>?
          </p>
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 mb-4">
            <p className="text-red-300 text-xs">
              <strong>Warning:</strong> This action cannot be undone. All group
              data, members, and attendance records will be permanently removed.
            </p>
          </div>
          {currentGroup?.id === groupToDelete.id && (
            <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-3">
              <p className="text-amber-300 text-xs">
                <strong>Note:</strong> This is your currently active group.
                Deleting it will clear your current selection.
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={cancelDeleteGroup}
            className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={confirmDeleteGroup}
            className="btn-error flex-1 px-4 py-2 rounded-lg text-sm"
          >
            Delete Group
          </button>
        </div>
      </div>
    </div>
  );
}
