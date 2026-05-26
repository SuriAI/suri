import { useCallback, useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

import { useUIStore } from "@/components/main/stores"
import {
  DEFAULT_REMOTE_BASE_URL,
  DEFAULT_SYNC_INTERVAL_MINUTES,
} from "../../../services/syncDefaults"
import { updaterService } from "@/services"

type RemoteSyncConfig = {
  enabled: boolean
  remoteBaseUrl: string
  organizationId: string
  organizationName: string
  siteId: string
  siteName: string
  deviceId: string
  deviceName: string
  intervalMinutes: number
  lastSyncedAt: string | null
  lastSyncStatus: "idle" | "success" | "error"
  lastSyncMessage: string | null
  connected: boolean
}

const defaultConfig: RemoteSyncConfig = {
  enabled: true,
  remoteBaseUrl: DEFAULT_REMOTE_BASE_URL,
  organizationId: "",
  organizationName: "",
  siteId: "",
  siteName: "",
  deviceId: "",
  deviceName: "Facenox Desktop",
  intervalMinutes: DEFAULT_SYNC_INTERVAL_MINUTES,
  lastSyncedAt: null,
  lastSyncStatus: "idle",
  lastSyncMessage: null,
  connected: false,
}

interface SyncProps {
  onNavigateToDB?: () => void
}

export function Sync({ onNavigateToDB }: SyncProps = {}) {
  const setSuccess = useUIStore((state) => state.setSuccess)
  const setError = useUIStore((state) => state.setError)
  const [config, setConfig] = useState<RemoteSyncConfig>(defaultConfig)
  const [remoteBaseUrl, setRemoteBaseUrl] = useState("")
  const [deviceName, setDeviceName] = useState("")
  const [pairingCode, setPairingCode] = useState("")
  const [intervalMinutes, setIntervalMinutes] = useState(DEFAULT_SYNC_INTERVAL_MINUTES)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [busyAction, setBusyAction] = useState<
    "saving" | "pairing" | "disconnecting" | "syncing" | null
  >(null)

  const syncFromConfig = useCallback((nextConfig: RemoteSyncConfig) => {
    const nextRemoteBaseUrl = nextConfig.remoteBaseUrl || DEFAULT_REMOTE_BASE_URL

    setConfig(nextConfig)
    setRemoteBaseUrl(nextRemoteBaseUrl === DEFAULT_REMOTE_BASE_URL ? "" : nextRemoteBaseUrl)
    setDeviceName(nextConfig.deviceName === "Facenox Desktop" ? "" : nextConfig.deviceName || "")
    setIntervalMinutes(nextConfig.intervalMinutes || DEFAULT_SYNC_INTERVAL_MINUTES)
    setShowAdvanced(nextRemoteBaseUrl !== DEFAULT_REMOTE_BASE_URL)
  }, [])

  const loadConfig = useCallback(async () => {
    const nextConfig = await window.electronAPI.sync.getConfig()
    syncFromConfig(nextConfig)
  }, [syncFromConfig])

  useEffect(() => {
    void loadConfig()
  }, [loadConfig])

  const handleSave = async () => {
    setBusyAction("saving")
    try {
      const nextConfig = await window.electronAPI.sync.updateConfig({
        remoteBaseUrl: remoteBaseUrl.trim(),
        deviceName,
        intervalMinutes,
        enabled: config.connected,
      })
      syncFromConfig(nextConfig)
      setSuccess(
        nextConfig.connected ?
          "Remote sync settings saved. Auto-sync state updated."
        : "Remote sync settings saved. You can pair this desktop whenever you're ready.",
      )
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not save Remote Sync settings.")
    } finally {
      setBusyAction(null)
    }
  }

  const handlePair = async () => {
    setBusyAction("pairing")
    try {
      const result = await window.electronAPI.sync.pairDevice({
        remoteBaseUrl: remoteBaseUrl.trim() || DEFAULT_REMOTE_BASE_URL,
        pairingCode,
        deviceName,
      })

      if (!result.success || !result.config) {
        throw new Error(result.error || "Pairing failed.")
      }

      syncFromConfig(result.config)
      setPairingCode("")
      if (result.initialSyncSucceeded === false) {
        setError(result.message || "Device paired successfully.")
      } else {
        setSuccess(result.message || "Device paired successfully.")
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not pair this desktop.")
    } finally {
      setBusyAction(null)
    }
  }

  const handleDisconnect = async () => {
    setBusyAction("disconnecting")
    try {
      const result = await window.electronAPI.sync.disconnectDevice()
      syncFromConfig(result.config)
      setPairingCode("")
      if (result.warning) {
        setError(`Disconnected locally, but the dashboard returned a warning: ${result.warning}`)
      } else {
        setSuccess("Device disconnected from Management Dashboard.")
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not disconnect this device.")
    } finally {
      setBusyAction(null)
    }
  }

  const handleManualSync = async () => {
    setBusyAction("syncing")
    try {
      const result = await window.electronAPI.sync.triggerNow()
      await loadConfig()
      if (result.success) {
        setSuccess(result.message)
      } else {
        setError(result.message)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Manual sync failed.")
    } finally {
      setBusyAction(null)
    }
  }

  const badgeTone = config.connected ? "bg-cyan-500/10 text-cyan-400" : "bg-white/5 text-white/50"

  const syncTone =
    config.lastSyncStatus === "success" ? "text-cyan-400/90"
    : config.lastSyncStatus === "error" ? "text-red-400"
    : "text-white/45"

  return (
    <div className="mx-auto w-full max-w-[900px] space-y-6 px-10 pt-8 pb-10">
      <div className="overflow-hidden">
        {/* Section 1: Connection status and linkage settings */}
        <div className="pt-6 pb-2">
          <h3 className="text-[10px] font-extrabold tracking-[0.2em] text-white/55 uppercase">
            Remote Sync
          </h3>
        </div>

        <div className="py-2">
          {/* Status Row */}
          <div className="flex items-center gap-4 py-4">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-white/90">Connection Status</div>
              <div className="relative min-h-4">
                <div className="mt-0.5 text-xs text-white/65">
                  {config.connected ?
                    `Linked to ${config.organizationName || "Remote Server"} • Site Location: ${config.siteName || "Default Site"}`
                  : "Operating locally. Remote syncing is disabled."}
                </div>
              </div>
            </div>
            <div
              className={`rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase ${badgeTone}`}>
              {config.connected ? "Online" : "Offline"}
            </div>
          </div>

          <div className="h-px w-full bg-white/8" />

          {/* Connection Actions Row */}
          <div className="flex flex-col gap-4 py-4">
            {!config.connected ?
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-white/90">Link Device</div>
                    <p className="mt-0.5 text-xs text-white/65">
                      Generate a code in the{" "}
                      <a
                        href="https://app.facenox.com"
                        onClick={(e) => {
                          e.preventDefault()
                          updaterService.openReleasePage("https://app.facenox.com")
                        }}
                        className="text-white transition-colors hover:underline">
                        Management Dashboard
                      </a>{" "}
                      and enter it below to connect this device.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAdvanced((value) => !value)}
                    className="group mt-1 flex shrink-0 items-center gap-1.5 text-xs font-semibold text-white/45 transition hover:text-white/70">
                    <span>{showAdvanced ? "Hide Advanced" : "Advanced Settings"}</span>
                    <i
                      className={`fa-solid ${showAdvanced ? "fa-chevron-up" : "fa-chevron-down"} text-[9px]`}
                    />
                  </button>
                </div>

                <div className="flex max-w-md flex-col gap-3 pt-2 sm:flex-row sm:items-end">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <label className="text-[10px] font-extrabold tracking-widest text-white/40 uppercase">
                      Pairing Code
                    </label>
                    <input
                      type="text"
                      placeholder="ABCD2345"
                      value={pairingCode}
                      onChange={(e) => setPairingCode(e.target.value.toUpperCase())}
                      className="h-9 w-full rounded border border-white/10 bg-transparent px-4 text-center font-mono text-[13px] font-semibold tracking-[0.25em] text-white uppercase transition-all duration-200 outline-none placeholder:text-center placeholder:tracking-[0.1em] placeholder:text-white/20 placeholder:lowercase focus:border-white/20"
                    />
                  </div>
                  <button
                    onClick={handlePair}
                    disabled={busyAction !== null || !pairingCode}
                    className="flex h-9 min-w-28 shrink-0 items-center justify-center gap-2 rounded border border-white/10 bg-[rgba(22,28,36,0.62)] px-4 text-xs font-semibold text-white/70 transition-all hover:bg-[rgba(22,28,36,0.85)] hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-40">
                    {busyAction === "pairing" && <i className="fa-solid fa-spinner fa-spin" />}
                    Connect
                  </button>
                </div>
              </div>
            : <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-white/90">Linked Device</div>
                    <p className="mt-0.5 text-xs text-white/65">
                      Device paired. Attendance logs are syncing automatically.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAdvanced((value) => !value)}
                    className="group mt-1 flex shrink-0 items-center gap-1.5 text-xs font-semibold text-white/45 transition hover:text-white/70">
                    <span>{showAdvanced ? "Hide Advanced" : "Advanced Settings"}</span>
                    <i
                      className={`fa-solid ${showAdvanced ? "fa-chevron-up" : "fa-chevron-down"} text-[9px]`}
                    />
                  </button>
                </div>

                <div className="grid max-w-xl gap-3 font-mono text-[11px] text-white/40 sm:grid-cols-2">
                  <div className="space-y-0.5">
                    <div>Device: {config.deviceName || "Facenox Desktop"}</div>
                    <div>Hardware ID: {config.deviceId}</div>
                  </div>
                  <div className="space-y-0.5 sm:text-right">
                    <div className={syncTone}>
                      {config.lastSyncedAt ?
                        `Last sync: ${new Date(config.lastSyncedAt).toLocaleString()}`
                      : "No successful sync yet."}
                    </div>
                    {config.lastSyncMessage && <div>Log: {config.lastSyncMessage}</div>}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={handleManualSync}
                    disabled={busyAction !== null}
                    className="flex items-center gap-2 rounded border border-white/10 bg-transparent px-4 py-1.5 text-[11.5px] font-medium text-white/70 transition-all hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40">
                    {busyAction === "syncing" && <i className="fa-solid fa-spinner fa-spin" />}
                    Sync Now
                  </button>
                  <button
                    onClick={handleDisconnect}
                    disabled={busyAction !== null}
                    className="flex items-center gap-2 rounded border border-red-500/20 bg-red-500/[0.03] px-4 py-1.5 text-[11.5px] font-semibold text-red-400 transition-all hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40">
                    {busyAction === "disconnecting" && (
                      <i className="fa-solid fa-spinner fa-spin" />
                    )}
                    Disconnect
                  </button>
                </div>
              </div>
            }

            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="overflow-hidden">
                  <div className="mt-4 grid gap-4 border-t border-white/5 pt-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold tracking-widest text-white/45 uppercase">
                          Custom Server URL
                        </label>
                        <input
                          type="url"
                          placeholder="Leave empty for official sync"
                          value={remoteBaseUrl}
                          disabled={config.connected}
                          onChange={(e) => setRemoteBaseUrl(e.target.value)}
                          className="h-8.5 w-full rounded border border-white/10 bg-transparent px-3 text-[12px] text-white transition-all duration-200 outline-none focus:border-white/20 disabled:cursor-not-allowed disabled:opacity-40"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold tracking-widest text-white/45 uppercase">
                          Device Name Override
                        </label>
                        <input
                          type="text"
                          placeholder="Facenox Desktop"
                          value={deviceName}
                          disabled={config.connected}
                          onChange={(e) => setDeviceName(e.target.value)}
                          className="h-8.5 w-full rounded border border-white/10 bg-transparent px-3 text-[12px] text-white transition-all duration-200 outline-none focus:border-white/20 disabled:cursor-not-allowed disabled:opacity-40"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={handleSave}
                        disabled={busyAction !== null}
                        className="flex items-center gap-2 rounded border border-white/10 bg-[rgba(22,28,36,0.62)] px-4 py-1.5 text-xs font-semibold text-white/70 transition-all hover:bg-[rgba(22,28,36,0.85)] hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-40">
                        {busyAction === "saving" && <i className="fa-solid fa-spinner fa-spin" />}
                        Save Configuration
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="overflow-hidden">
        {/* Section 2: Data Boundaries */}
        <div className="pt-10 pb-2">
          <h3 className="text-[10px] font-extrabold tracking-[0.25em] text-white/55 uppercase">
            Data Boundaries
          </h3>
        </div>

        <div className="py-2">
          <div className="grid gap-x-12 gap-y-6 py-4 sm:grid-cols-2">
            <div className="space-y-3">
              <h4 className="text-[12px] font-semibold text-white/80">Shared with Dashboard</h4>
              <ul className="space-y-3 text-[12px] text-white/45">
                <li>
                  <span className="font-medium text-white/70">Member Profiles:</span> Names, email
                  addresses, roles, and group memberships synced with the dashboard.
                </li>
                <li>
                  <span className="font-medium text-white/70">Attendance History:</span> Time-in and
                  time-out logs for reporting.
                </li>
                <li>
                  <span className="font-medium text-white/70">Device Status:</span> Hostname,
                  network connection quality, and current app update status.
                </li>
                <li>
                  <span className="font-medium text-white/70">System Settings:</span> Sync limits
                  and attendance rules set by organization.
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-[12px] font-semibold text-white/80">Stored Locally Only</h4>
              <ul className="space-y-3 text-[12px] text-white/45">
                <li>
                  <span className="font-medium text-white/70">Biometric Data:</span> Secure
                  mathematical codes used to identify members.{" "}
                  <span className="font-medium text-cyan-400/90">
                    No raw photos are stored even locally
                  </span>
                  , and biometric data never leaves this device.
                </li>
                <li>
                  <span className="font-medium text-white/70">Live Camera Feed:</span> Temporary
                  video processing frames; camera footage is{" "}
                  <span className="font-medium text-cyan-400/90">never</span> recorded or uploaded.
                </li>
                <li>
                  {onNavigateToDB ?
                    <button
                      onClick={onNavigateToDB}
                      className="font-medium text-white/70 hover:text-cyan-400 hover:underline">
                      Offline Database:
                    </button>
                  : <span className="font-medium text-white/70">Offline Database:</span>}{" "}
                  Secured database containing local attendance records and device configurations.
                </li>
                <li>
                  <span className="font-medium text-white/70">Local AI Processing:</span> All face
                  detection, recognition, and liveness checks are computed strictly on this machine.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
