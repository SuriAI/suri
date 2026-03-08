interface BulkUploadAreaProps {
  uploadedCount: number
  isDetecting: boolean
  onFilesSelected: (files: FileList | null) => void
  onClear: () => void
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
        <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-3">
            {isDetecting ?
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300">
                <i className="fa-solid fa-circle-notch fa-spin text-xl"></i>
              </div>
            : <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-300">
                <i className="fa-solid fa-check text-xl"></i>
              </div>
            }

            <div>
              <div className="text-sm font-medium text-white">
                {isDetecting ? "Analyzing images..." : `${uploadedCount} images uploaded`}
              </div>
              <div className="text-xs text-white/40">
                {isDetecting ? "Please wait while we process faces" : "Ready for assignment"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClear}
              disabled={isDetecting}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/20 text-red-200 transition hover:bg-red-500/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              title="Clear all files">
              <i className="fa-solid fa-trash text-sm"></i>
            </button>

            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white transition hover:bg-white/10">
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                disabled={isDetecting}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    onFilesSelected(e.target.files)
                    // Reset input value to allow selecting same files again if needed
                    e.target.value = ""
                  }
                }}
              />
              <i className="fa-solid fa-plus text-xs"></i>
              <span>Add More</span>
            </label>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-6">
      <label className="group relative flex h-48 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-white/10 bg-linear-to-br from-white/5 to-transparent transition-all hover:border-white/20 hover:from-white/10">
        <div className="absolute inset-0 bg-linear-to-br from-white/0 to-white/0 transition-all group-hover:from-white/5 group-hover:to-transparent" />
        <div className="relative flex flex-col items-center gap-3">
          <div className="text-center">
            <div className="mb-1 text-sm text-white/70">Drop images or click to browse</div>
            <div className="text-xs text-white/40">Up to 50 photos • Class or individual</div>
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
  )
}
