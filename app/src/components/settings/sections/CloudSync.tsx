import { useState } from "react";

type SyncStatus =
  | { type: "idle" }
  | { type: "loading"; action: "export" | "import" }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

export function CloudSync() {
  const [status, setStatus] = useState<SyncStatus>({ type: "idle" });

  const handleExport = async () => {
    setStatus({ type: "loading", action: "export" });
    try {
      const result = await window.electronAPI.sync.exportData();
      if (result.canceled) {
        setStatus({ type: "idle" });
        return;
      }
      if (result.success) {
        setStatus({
          type: "success",
          message: `Exported successfully to: ${result.filePath}`,
        });
      } else {
        setStatus({
          type: "error",
          message: result.error ?? "Export failed.",
        });
      }
    } catch (err) {
      setStatus({
        type: "error",
        message: err instanceof Error ? err.message : "Export failed.",
      });
    }
  };

  const handleImport = async (overwrite = false) => {
    setStatus({ type: "loading", action: "import" });
    try {
      const result = await window.electronAPI.sync.importData(overwrite);
      if (result.canceled) {
        setStatus({ type: "idle" });
        return;
      }
      if (result.success) {
        setStatus({
          type: "success",
          message: result.message ?? "Import complete.",
        });
      } else {
        setStatus({
          type: "error",
          message: result.error ?? "Import failed.",
        });
      }
    } catch (err) {
      setStatus({
        type: "error",
        message: err instanceof Error ? err.message : "Import failed.",
      });
    }
  };

  const isLoading = status.type === "loading";

  return (
    <div className="space-y-8 max-w-auto p-10">
      {/* Header explanation */}
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-white">
          Backup & Device Migration
        </h3>
        <p className="text-xs text-white/50 leading-relaxed max-w-lg">
          Export your attendance data as a JSON file to back it up or transfer
          it to another device running Suri. Face recognition data is{" "}
          <span className="text-amber-400/80 font-medium">not included</span> —
          members will need to be re-enrolled for camera recognition on the new
          device.
        </p>
      </div>

      {/* Status feedback */}
      {status.type !== "idle" && (
        <div
          className={`flex items-start gap-3 px-4 py-3 rounded-lg border text-xs ${
            status.type === "loading"
              ? "bg-white/5 border-white/10 text-white/60"
              : status.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-rose-500/10 border-rose-500/20 text-rose-400"
          }`}
        >
          {status.type === "loading" ? (
            <>
              <i className="fa-solid fa-circle-notch fa-spin mt-0.5 flex-shrink-0" />
              <span>
                {status.action === "export"
                  ? "Exporting data…"
                  : "Importing data…"}
              </span>
            </>
          ) : status.type === "success" ? (
            <>
              <i className="fa-solid fa-circle-check mt-0.5 flex-shrink-0" />
              <span className="break-all">{status.message}</span>
            </>
          ) : (
            <>
              <i className="fa-solid fa-circle-exclamation mt-0.5 flex-shrink-0" />
              <span>{status.message}</span>
            </>
          )}
        </div>
      )}

      {/* Export card */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
        <div className="px-6 py-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 mb-1">
            <i className="fa-solid fa-upload text-cyan-400 text-sm" />
            <h4 className="text-sm font-semibold text-white">Export Data</h4>
          </div>
          <p className="text-xs text-white/50">
            Save a complete snapshot of all groups, members, and attendance
            records to a <code className="text-white/70">.json</code> file.
          </p>
        </div>
        <div className="px-6 py-4">
          <button
            onClick={handleExport}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/25 text-cyan-400 text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLoading && status.action === "export" ? (
              <i className="fa-solid fa-circle-notch fa-spin" />
            ) : (
              <i className="fa-solid fa-download" />
            )}
            Export to File
          </button>
        </div>
      </div>

      {/* Import card */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
        <div className="px-6 py-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 mb-1">
            <i className="fa-solid fa-file-import text-blue-400 text-sm" />
            <h4 className="text-sm font-semibold text-white">Import Data</h4>
          </div>
          <p className="text-xs text-white/50">
            Restore from a previously exported{" "}
            <code className="text-white/70">.json</code> file. Existing records
            are skipped by default — no duplicates will be created.
          </p>
        </div>
        <div className="px-6 py-4 space-y-3">
          <button
            onClick={() => handleImport(false)}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/25 text-blue-400 text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLoading && status.action === "import" ? (
              <i className="fa-solid fa-circle-notch fa-spin" />
            ) : (
              <i className="fa-solid fa-file-arrow-up" />
            )}
            Import from File
          </button>
          <p className="text-[10px] text-white/30 leading-relaxed max-w-md">
            <strong className="text-white/40">Overwrite mode:</strong> If you
            want to force-replace existing data with the imported version, use
            the option below.
          </p>
          <button
            onClick={() => handleImport(true)}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-amber-400 text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <i className="fa-solid fa-triangle-exclamation text-[10px]" />
            Import & Overwrite Existing
          </button>
        </div>
      </div>

      {/* Advisory note */}
      <div className="flex items-start gap-3 text-[10px] text-white/30 leading-relaxed">
        <i className="fa-solid fa-shield-halved mt-0.5 flex-shrink-0 text-white/20" />
        <p className="max-w-md">
          Face embeddings (biometric data) are intentionally excluded from all
          exports. They remain on this device only, in compliance with
          privacy-by-design principles.
        </p>
      </div>
    </div>
  );
}
