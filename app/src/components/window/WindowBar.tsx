import { useState, useEffect } from "react"
import { Tooltip } from "@/components/shared"

function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return "Never"
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    if (isNaN(diffMs)) return "Never"

    const diffSecs = Math.floor(diffMs / 1000)
    if (diffSecs < 10) return "Just now"
    if (diffSecs < 60) return `${diffSecs}s ago`

    const diffMins = Math.floor(diffSecs / 60)
    if (diffMins < 60) return `${diffMins}m ago`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`

    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  } catch {
    return "Never"
  }
}

export default function WindowBar() {
  const [isMaximized, setIsMaximized] = useState(false)
  const [syncConfig, setSyncConfig] = useState<{
    connected: boolean
    enabled: boolean
    lastSyncedAt: string | null
    lastSyncStatus: "idle" | "success" | "error"
    lastSyncMessage: string | null
  } | null>(null)

  useEffect(() => {
    if (!window.electronAPI?.sync) return

    const fetchConfig = () => {
      window.electronAPI.sync.getConfig().then(setSyncConfig).catch(console.error)
    }

    fetchConfig()

    const unsubscribe = window.electronAPI.sync.onDataChanged(() => {
      fetchConfig()
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    const handleMaximize = () => setIsMaximized(true)
    const handleUnmaximize = () => setIsMaximized(false)

    let cleanupMaximize: (() => void) | undefined
    let cleanupUnmaximize: (() => void) | undefined

    if (window.facenoxElectron) {
      cleanupMaximize = window.facenoxElectron.onMaximize(handleMaximize)
      cleanupUnmaximize = window.facenoxElectron.onUnmaximize(handleUnmaximize)
    }

    return () => {
      if (cleanupMaximize) cleanupMaximize()
      if (cleanupUnmaximize) cleanupUnmaximize()
    }
  }, [])

  const handleMinimize = () => {
    if (window.facenoxElectron) {
      window.facenoxElectron.minimize()
    }
  }

  const handleMaximize = () => {
    if (window.facenoxElectron) {
      window.facenoxElectron.maximize()
    }
  }

  const handleClose = () => {
    if (window.facenoxElectron) {
      window.facenoxElectron.close()
    }
  }

  const platform = window.facenoxElectron?.platform || "win32"
  const isLinux = platform === "linux"
  const isMac = platform === "darwin"

  const iconStyle = (iconName: string) => ({
    maskImage: `url(./icons/window/${iconName}.svg)`,
    WebkitMaskImage: `url(./icons/window/${iconName}.svg)`,
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
    maskPosition: "center",
    WebkitMaskPosition: "center",
    maskSize: "10px",
    WebkitMaskSize: "10px",
  })

  return (
    <div
      className="relative flex h-[32px] w-full shrink-0 items-center justify-between border-b border-white/8 select-none"
      style={
        {
          WebkitAppRegion: isMaximized ? "no-drag" : "drag",
        } as React.CSSProperties
      }>
      {/* Spacer for Mac native traffic lights */}
      {isMac && <div className="w-[80px] shrink-0" />}

      <div className="relative z-40 ml-3 flex flex-1 items-center gap-3">
        <img
          src="./icons/logo-transparent.png"
          alt="Facenox"
          className={`${isMac ? "-ml-4" : ""} pointer-events-none h-4 w-4 object-contain opacity-60`}
        />
        {(() => {
          if (!syncConfig) return null

          const isSyncEnabled = syncConfig.connected && syncConfig.enabled
          let dotColorClass: string
          let statusText: string
          let tooltipContent: string

          if (!isSyncEnabled) {
            dotColorClass = "bg-white/35"
            statusText = "Local"
            tooltipContent =
              "Running in offline mode. Biometrics and attendance records are stored only on this device."
          } else {
            const relativeTime = formatRelativeTime(syncConfig.lastSyncedAt)
            if (syncConfig.lastSyncStatus === "success") {
              dotColorClass = "bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.4)]"
              statusText = "Synced"
              tooltipContent = `Last synced: ${relativeTime}. ${syncConfig.lastSyncMessage || "All records are up to date."}`
            } else if (syncConfig.lastSyncStatus === "error") {
              dotColorClass = "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]"
              statusText = "Sync Warning"
              tooltipContent = `Failed to sync: ${syncConfig.lastSyncMessage || "Network connection issue."} (Last success: ${relativeTime})`
            } else {
              dotColorClass = "bg-cyan-500/50"
              statusText = "Ready"
              tooltipContent = "Paired with cloud. Waiting for next automatic sync cycle."
            }
          }

          return (
            <Tooltip content={tooltipContent} position="bottom" offset={6}>
              <div className="pointer-events-auto flex cursor-default items-center gap-1.5 text-[9px] font-bold tracking-wide text-white/50 transition-all duration-200 select-none [webkit-app-region:no-drag] hover:text-white/75">
                <span className={`h-1.5 w-1.5 rounded-full ${dotColorClass}`} />
                <span>{statusText}</span>
              </div>
            </Tooltip>
          )
        })()}
      </div>

      {!isMac && (
        <div
          className={`relative z-70 flex h-full [webkit-app-region:no-drag] ${
            isLinux ? "items-center px-1" : "items-stretch"
          }`}
          style={
            {
              WebkitAppRegion: "no-drag",
            } as React.CSSProperties
          }>
          {/* Minimize */}
          <button
            onClick={handleMinimize}
            title="Minimize"
            className={`group flex items-center justify-center border-none bg-transparent p-0 transition-all duration-150 outline-none ${
              isLinux ?
                "mx-0.5 h-[28px] w-[28px] rounded-full hover:bg-white/10"
              : "h-full w-[46px] hover:bg-white/10"
            }`}>
            <span
              className="h-full w-full bg-white/70 transition-colors group-hover:bg-white"
              style={iconStyle("minimize")}
            />
          </button>

          {/* Maximize / Restore */}
          <button
            onClick={handleMaximize}
            title={isMaximized ? "Restore" : "Maximize"}
            className={`group flex items-center justify-center border-none bg-transparent p-0 transition-all duration-150 outline-none ${
              isLinux ?
                "mx-0.5 h-[28px] w-[28px] rounded-full hover:bg-white/10"
              : "h-full w-[46px] hover:bg-white/10"
            }`}>
            <span
              className="h-full w-full bg-white/70 transition-colors group-hover:bg-white"
              style={iconStyle(isMaximized ? "restore-down" : "maximize")}
            />
          </button>

          {/* Close */}
          <button
            onClick={handleClose}
            title="Close"
            className={`group flex items-center justify-center border-none bg-transparent p-0 transition-all duration-150 outline-none ${
              isLinux ?
                "mx-0.5 h-[28px] w-[28px] rounded-full hover:bg-[#e81123]"
              : "h-full w-[46px] hover:bg-[#e81123]"
            }`}>
            <span
              className="h-full w-full bg-white/80 transition-colors group-hover:bg-white"
              style={iconStyle("close")}
            />
          </button>
        </div>
      )}
    </div>
  )
}
