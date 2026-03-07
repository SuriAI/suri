import { useState } from "react";
import type { SettingsOverview } from "@/components/settings/types";
import type { AttendanceGroup } from "@/types/recognition";
import { useDatabaseManagement } from "@/components/settings/sections/hooks/useDatabaseManagement";
import { DatabaseStats } from "@/components/settings/sections/components/DatabaseStats";
import { GroupEntry } from "@/components/settings/sections/components/GroupEntry";
import { useDialog } from "@/components/shared";
import { Modal } from "@/components/common/Modal";
import { useUIStore } from "@/components/main/stores";
import { attendanceManager } from "@/services";

type BackupStatus =
  | { type: "idle" }
  | { type: "loading"; action: "export" | "import" };

interface DatabaseProps {
  systemData: SettingsOverview;
  groups: AttendanceGroup[];
  isLoading: boolean;
  onClearDatabase: () => void;
  onGroupsChanged?: () => void;
}

export function Database({
  systemData,
  groups,
  isLoading,
  onClearDatabase,
  onGroupsChanged,
}: DatabaseProps) {
  const dialog = useDialog();
  const {
    expandedGroups,
    searchQuery,
    setSearchQuery,
    editingMember,
    editingGroup,
    editValue,
    setEditValue,
    savingMember,
    savingGroup,
    deletingGroup,
    deletingMember,
    filteredData,
    toggleGroup,
    startEditing,
    startEditingGroup,
    cancelEditing,
    saveEdit,
    saveGroupEdit,
    handleDeleteGroup,
    handleDeleteMember,
    handleClearAllGroups,
    totalMembers,
  } = useDatabaseManagement(groups, onGroupsChanged, dialog);

  const { setError, setSuccess } = useUIStore();

  const [status, setStatus] = useState<BackupStatus>({ type: "idle" });
  const [isExportingAuditLog, setIsExportingAuditLog] = useState(false);
  const [passwordModal, setPasswordModal] = useState<{
    isOpen: boolean;
    action: "export" | "import";
    overwrite?: boolean;
  }>({ isOpen: false, action: "export" });
  const [importFilePath, setImportFilePath] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState("");

  const handleExport = async (password: string) => {
    setStatus({ type: "loading", action: "export" });
    try {
      const result = await window.electronAPI.sync.exportData(password);
      if (result.canceled) {
        setStatus({ type: "idle" });
        return;
      }
      if (result.success) {
        setSuccess(`Backup saved to: ${result.filePath}`);
        setStatus({ type: "idle" });
      } else {
        setError(result.error ?? "Failed to create backup.");
        setStatus({ type: "idle" });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Backup failed.");
      setStatus({ type: "idle" });
    }
  };

  const handleImport = async (password: string, overwriteAttr = false) => {
    if (!importFilePath) return;

    setStatus({ type: "loading", action: "import" });
    try {
      const result = await window.electronAPI.sync.importData(
        password,
        importFilePath,
        overwriteAttr,
      );
      if (result.canceled) {
        setStatus({ type: "idle" });
        return;
      }
      if (result.success) {
        setSuccess(result.message ?? "Restore complete.");
        setStatus({ type: "idle" });
        setImportFilePath(null);
        if (onGroupsChanged) onGroupsChanged();
      } else {
        setError(result.error ?? "Failed to restore data.");
        setStatus({ type: "idle" });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Restore failed.");
      setStatus({ type: "idle" });
    }
  };

  const startImportFlow = async () => {
    try {
      const result = await window.electronAPI.sync.pickImportFile();
      if (result.canceled || !result.filePath) return;

      setImportFilePath(result.filePath);
      setPasswordModal({
        isOpen: true,
        action: "import",
        overwrite: false,
      });
    } catch {
      setError("Failed to open file picker.");
    }
  };

  const isBackingUp = status.type === "loading";

  const handleExportAuditLog = async () => {
    setIsExportingAuditLog(true);
    try {
      await attendanceManager.downloadAuditLog();
      setSuccess("Audit log downloaded.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to export audit log.",
      );
    } finally {
      setIsExportingAuditLog(false);
    }
  };

  return (
    <div className="space-y-6 max-w-auto pt-4 px-10 pb-10">
      {/* Statistics Overview */}
      <DatabaseStats
        groupsCount={groups.length}
        totalMembers={totalMembers}
        totalPersons={systemData.totalPersons}
      />

      {/* Backup & Restore Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Create Backup */}
        <div className="rounded-lg border border-white/10 bg-white/5 overflow-hidden flex flex-col h-full">
          <div className="px-5 py-4 border-b border-white/6 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <i className="fa-solid fa-download text-cyan-400 text-xs" />
              <h4 className="text-xs font-semibold text-white">
                Export Database
              </h4>
            </div>
            <p className="text-[11px] text-white/40 leading-relaxed font-medium">
              Exports an encrypted{" "}
              <code className="font-mono text-cyan-400/50">.suri</code> database
              · members, history, and biometric profiles.
            </p>
          </div>
          <div className="px-5 py-4 mt-auto">
            <button
              onClick={() =>
                setPasswordModal({ isOpen: true, action: "export" })
              }
              disabled={isBackingUp}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 text-[11px] font-bold uppercase tracking-wider transition-all disabled:opacity-40 active:scale-95"
            >
              {isBackingUp && status.action === "export" ? (
                <i className="fa-solid fa-circle-notch fa-spin" />
              ) : (
                <i className="fa-solid fa-file-export" />
              )}
              Export
            </button>
          </div>
        </div>

        {/* Restore Backup */}
        <div className="rounded-lg border border-white/10 bg-white/5 overflow-hidden flex flex-col h-full">
          <div className="px-5 py-4 border-b border-white/6 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <i className="fa-solid fa-upload text-cyan-400 text-xs" />
              <h4 className="text-xs font-semibold text-white">
                Import Database
              </h4>
            </div>
            <p className="text-[11px] text-white/40 leading-relaxed font-medium">
              Restores from a{" "}
              <code className="font-mono text-cyan-400/50">.suri</code> backup
              file. Requires the original password.
            </p>
          </div>
          <div className="px-5 py-4 mt-auto">
            <button
              onClick={startImportFlow}
              disabled={isBackingUp}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 text-[11px] font-bold uppercase tracking-wider transition-all disabled:opacity-40 active:scale-95"
            >
              {isBackingUp && status.action === "import" ? (
                <i className="fa-solid fa-circle-notch fa-spin" />
              ) : (
                <i className="fa-solid fa-file-import" />
              )}
              Import
            </button>
          </div>
        </div>
      </div>

      {/* Audit Log Export */}
      <div className="rounded-lg border border-white/10 bg-white/5 overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <i className="fa-solid fa-shield-halved text-cyan-400 text-xs" />
              <h4 className="text-xs font-semibold text-white">Audit Log</h4>
            </div>
            <p className="text-[11px] text-white/40 leading-relaxed font-medium">
              Download a CSV of all admin actions — consent changes, deletions,
              vault imports/exports. Required for DPA compliance review.
            </p>
          </div>
          <button
            onClick={handleExportAuditLog}
            disabled={isExportingAuditLog}
            className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white text-[11px] font-bold uppercase tracking-wider transition-all disabled:opacity-40 active:scale-95"
          >
            {isExportingAuditLog ? (
              <i className="fa-solid fa-circle-notch fa-spin" />
            ) : (
              <i className="fa-solid fa-file-csv" />
            )}
            Export CSV
          </button>
        </div>
      </div>

      {/* Password Prompt Modal */}
      <Modal
        isOpen={passwordModal.isOpen}
        onClose={() => {
          setPasswordModal({ ...passwordModal, isOpen: false });
          setPasswordInput("");
        }}
        title={
          passwordModal.action === "export"
            ? "Set Vault Password"
            : "Unlock Vault"
        }
        icon={
          <i
            className={`fa-solid ${
              passwordModal.action === "export" ? "fa-shield-halved" : "fa-lock"
            } text-cyan-400`}
          />
        }
      >
        <div className="space-y-4">
          <p className="text-[11px] text-white/50 leading-relaxed">
            {passwordModal.action === "export"
              ? "Choose a strong password to encrypt your vault. You will need this password to restore your data later."
              : `Enter the password used to encrypt ${
                  importFilePath?.split(/[\\/]/).pop() || "this vault"
                } to decrypt and restore your data.`}
          </p>
          <div className="space-y-1.5">
            <label className="text-[11px] text-white/30 font-medium">
              Vault Password
            </label>
            <input
              type="password"
              autoFocus
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && passwordInput) {
                  const pass = passwordInput;
                  setPasswordInput("");
                  setPasswordModal({ ...passwordModal, isOpen: false });
                  if (passwordModal.action === "export") {
                    handleExport(pass);
                  } else {
                    handleImport(pass, passwordModal.overwrite);
                  }
                }
              }}
              placeholder="Enter password..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none transition-all duration-300 focus:border-cyan-500/30 focus:bg-white/10 focus:ring-4 focus:ring-cyan-500/10"
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => {
                setPasswordModal({ ...passwordModal, isOpen: false });
                setPasswordInput("");
              }}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              disabled={!passwordInput}
              onClick={() => {
                const pass = passwordInput;
                setPasswordInput("");
                setPasswordModal({ ...passwordModal, isOpen: false });
                if (passwordModal.action === "export") {
                  handleExport(pass);
                } else {
                  handleImport(pass, passwordModal.overwrite);
                }
              }}
              className="px-6 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 transition-all text-[11px] font-bold uppercase tracking-wider disabled:opacity-50 min-w-25 active:scale-95"
            >
              {passwordModal.action === "export" ? "Export" : "Import"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Search */}
      <div className="relative group/search max-w-sm mx-auto">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35 group-focus-within/search:text-cyan-400 transition-colors pointer-events-none">
          <i className="fa-solid fa-magnifying-glass text-[11px]"></i>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search members or groups…"
          className="w-full pl-9 pr-8 py-2 bg-white/5 border border-white/10 rounded-xl text-[11px] font-medium text-white placeholder-white/25 outline-none transition-all duration-300 focus:border-cyan-500/30 focus:bg-white/10 focus:ring-4 focus:ring-cyan-500/10"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full text-white/30 hover:text-white/70 hover:bg-white/10 transition-all border-none bg-transparent p-0"
          >
            <i className="fa-solid fa-xmark text-[9px]"></i>
          </button>
        )}
      </div>

      {/* Groups with Members List */}
      <div
        className={`space-y-2 pb-4 ${
          filteredData.length === 0 ? "h-32" : "h-auto"
        }`}
      >
        {filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-white/20 bg-white/2 rounded-2xl border border-dashed border-white/5">
            <i className="fa-solid fa-ghost text-2xl mb-3 opacity-50" />
            <div className="text-[11px] font-medium">No results found</div>
            {groups.length === 0 && (
              <div className="text-[10px] mt-1 italic">
                Create a group to begin managing members.
              </div>
            )}
          </div>
        ) : (
          filteredData.map((group) => (
            <GroupEntry
              key={group.id}
              group={group}
              isExpanded={expandedGroups.has(group.id)}
              editingGroup={editingGroup}
              editingMember={editingMember}
              editValue={editValue}
              savingGroup={savingGroup}
              savingMember={savingMember}
              deletingGroup={deletingGroup}
              deletingMember={deletingMember}
              onToggle={toggleGroup}
              onStartEditingGroup={startEditingGroup}
              onStartEditingMember={startEditing}
              onEditValueChange={setEditValue}
              onSaveGroupEdit={saveGroupEdit}
              onSaveMemberEdit={saveEdit}
              onCancelEditing={cancelEditing}
              onDeleteGroup={handleDeleteGroup}
              onDeleteMember={handleDeleteMember}
            />
          ))
        )}
      </div>

      {/* Clear Actions */}
      <div className="overflow-hidden">
        <div className="py-2 border-b border-white/5">
          <h3 className="text-[11px] font-bold text-red-500/60 flex items-center gap-2 uppercase tracking-wider">
            <i className="fa-solid fa-triangle-exclamation text-[10px]"></i>
            Danger Zone
          </h3>
        </div>
        <div className="py-4 flex items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-[11px] text-white/35 leading-relaxed font-bold mt-1 uppercase tracking-tight">
              Deleting groups is permanent. Face data is managed separately from
              records.
            </p>
          </div>

          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleClearAllGroups}
              disabled={
                isLoading || deletingGroup === "all" || groups.length === 0
              }
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/5 hover:bg-red-500/15 border border-red-500/20 text-[11px] font-black uppercase tracking-wider text-red-400 transition-all disabled:opacity-20 active:scale-95"
            >
              {deletingGroup === "all" ? (
                <i className="fa-solid fa-spinner fa-spin"></i>
              ) : (
                <i className="fa-solid fa-layer-group"></i>
              )}
              Clear Groups
            </button>

            <button
              onClick={onClearDatabase}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/5 hover:bg-amber-500/15 border border-amber-500/20 text-[11px] font-black uppercase tracking-wider text-amber-500/70 hover:text-amber-500 transition-all disabled:opacity-20 active:scale-95"
            >
              <i className="fa-solid fa-user-slash"></i>
              Clear Face Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
