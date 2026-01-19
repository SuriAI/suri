interface BulkUploadAreaProps {
  uploadedCount: number;
  isDetecting: boolean;
  onFilesSelected: (files: FileList | null) => void;
  onClear: () => void;
}

export function BulkUploadArea({
  uploadedCount,
  isDetecting,
  onFilesSelected,
  onClear,
}: BulkUploadAreaProps) {
  if (uploadedCount > 0) {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-3">
            {isDetecting ? (
              <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-300">
                <svg
                  className="w-5 h-5 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
            ) : (
              <div className="h-10 w-10 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-300">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
              </div>
            )}

            <div>
              <div className="text-sm font-medium text-white">
                {isDetecting
                  ? "Analyzing images..."
                  : `${uploadedCount} images uploaded`}
              </div>
              <div className="text-xs text-white/40">
                {isDetecting
                  ? "Please wait while we process faces"
                  : "Ready for assignment"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Clear Button */}
            <button
              onClick={onClear}
              disabled={isDetecting}
              className="h-9 w-9 flex items-center justify-center rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-200 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
              title="Clear all files"
            >
              <i className="fa-solid fa-trash text-sm"></i>
            </button>

            <label className="cursor-pointer px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-white border border-white/10 transition flex items-center gap-2">
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                disabled={isDetecting}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    onFilesSelected(e.target.files);
                    // Reset input value to allow selecting same files again if needed
                    e.target.value = "";
                  }
                }}
              />
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>Add More</span>
            </label>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <label className="group relative flex h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/10 bg-gradient-to-br from-white/5 to-transparent hover:border-white/20 hover:from-white/10 transition-all overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/0 group-hover:from-white/5 group-hover:to-transparent transition-all" />
        <div className="relative flex flex-col items-center gap-3">
          <div className="text-center">
            <div className="text-sm text-white/70 mb-1">
              Drop images or click to browse
            </div>
            <div className="text-xs text-white/40">
              Up to 50 photos • Class or individual
            </div>
          </div>
        </div>
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => onFilesSelected(e.target.files)}
        />
      </label>
    </div>
  );
}
