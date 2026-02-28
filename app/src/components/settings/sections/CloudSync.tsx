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
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-white">
          Data Safety & Transfers
        </h3>
        <p className="text-xs text-white/50 leading-relaxed max-w-lg">
          Keep your information safe by creating a copy you can store or move to
          a new computer. This includes all your members and history, but for
          privacy,{" "}
          <span className="text-amber-400/80 font-medium">face data</span> is
          kept only on this device.
        </p>
      </div>

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
                  ? "Saving your data copy…"
                  : "Bringing back your data…"}
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

      <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
        <div className="px-6 py-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 mb-1">
            <i className="fa-solid fa-upload text-cyan-400 text-sm" />
            <h4 className="text-sm font-semibold text-white">
              Create a Backup
            </h4>
          </div>
          <p className="text-xs text-white/50">
            Download a portable copy of your attendance data for safekeeping.
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
            Download Backup File
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
        <div className="px-6 py-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 mb-1">
            <i className="fa-solid fa-file-import text-blue-400 text-sm" />
            <h4 className="text-sm font-semibold text-white">
              Restore from Backup
            </h4>
          </div>
          <p className="text-xs text-white/50">
            Upload a backup file you created earlier. Suri will intelligently
            skip records you already have to avoid duplicates.
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
            Upload Backup File
          </button>
          <div className="pt-4 border-t border-white/[0.04] space-y-3">
            <p className="text-[10px] text-white/30 leading-relaxed max-w-md">
              <strong className="text-amber-400/50">Advanced:</strong> If you
              want to completely replace your current data with the contents of
              the backup file, use the button below.
            </p>
            <button
              onClick={() => handleImport(true)}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/15 text-amber-400/70 text-[10px] font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <i className="fa-solid fa-triangle-exclamation text-[10px]" />
              Restore & Overwrite Current Data
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-4 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
        <i className="fa-solid fa-shield-halved mt-0.5 flex-shrink-0 text-blue-400/40" />
        <div className="space-y-1">
          <h5 className="text-[11px] font-semibold text-blue-400/80">
            Your privacy matters
          </h5>
          <p className="text-[10px] text-white/40 leading-relaxed max-w-lg">
            Face signatures (biometric data) never leave this computer. They are
            intentionally excluded from backup files to ensure they stay under
            your direct control at all times.
          </p>
        </div>
      </div>
    </div>
  );
}
