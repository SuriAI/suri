import type {
  AttendanceGroup,
  AttendanceMember,
} from "../../../types/recognition";
import { useBulkRegistration } from "./hooks/useBulkRegistration";
import { BulkUploadArea } from "./components/BulkUploadArea";
import { FaceAssignmentGrid } from "./components/FaceAssignmentGrid";
import { RegistrationResults } from "./components/RegistrationResults";

interface BulkFaceRegistrationProps {
  group: AttendanceGroup;
  members: AttendanceMember[];
  onRefresh?: () => Promise<void> | void;
  onClose: () => void;
}

export function BulkFaceRegistration({
  group,
  members,
  onRefresh,
  onClose,
}: BulkFaceRegistrationProps) {
  const {
    uploadedFiles,
    detectedFaces,
    isDetecting,
    isRegistering,
    error,
    setError,
    registrationResults,
    availableMembers,
    handleFilesSelected,
    handleAssignMember,
    handleUnassign,
    handleBulkRegister,
  } = useBulkRegistration(group, members, onRefresh);

  const assignedCount = detectedFaces.filter((f) => f.assignedPersonId).length;
  const successCount =
    registrationResults?.filter((r) => r.success).length || 0;
  const failedCount =
    registrationResults?.filter((r) => !r.success).length || 0;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-[#0a0a0a] to-black border border-white/10 rounded-3xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-lg font-medium text-white">
                Batch Registration
              </h2>
              <p className="text-xs text-white/40 mt-0.5">{group.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/80 transition flex items-center justify-center"
          >
            <i className="fa fa-times text-sm"></i>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-200 flex items-center gap-3">
            <div className="h-1 w-1 rounded-full bg-red-400 animate-pulse" />
            <span className="flex-1">{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-200/50 hover:text-red-100 transition"
            >
              <i className="fa fa-times text-xs"></i>
            </button>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* Step 1: Upload Files */}
          {!registrationResults && (
            <BulkUploadArea
              uploadedCount={uploadedFiles.length}
              isDetecting={isDetecting}
              onFilesSelected={handleFilesSelected}
            />
          )}

          {/* Step 2: Assign Members */}
          {detectedFaces.length > 0 && !registrationResults && (
            <FaceAssignmentGrid
              detectedFaces={detectedFaces}
              members={members}
              availableMembers={availableMembers}
              assignedCount={assignedCount}
              isRegistering={isRegistering}
              onAssignMember={handleAssignMember}
              onUnassign={handleUnassign}
              onBulkRegister={handleBulkRegister}
            />
          )}

          {/* Step 3: Results */}
          {registrationResults && (
            <RegistrationResults
              results={registrationResults}
              successCount={successCount}
              failedCount={failedCount}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
}
