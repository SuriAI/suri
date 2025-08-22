import { useState, useEffect } from 'react'

interface TitleBarProps {
  title?: string
}

export default function TitleBar({ title = 'SURI' }: TitleBarProps) {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    // Listen for window state changes
    const handleMaximize = () => setIsMaximized(true)
    const handleUnmaximize = () => setIsMaximized(false)

    let cleanupMaximize: (() => void) | undefined
    let cleanupUnmaximize: (() => void) | undefined

    if (window.suriElectron) {
      cleanupMaximize = window.suriElectron.onMaximize(handleMaximize)
      cleanupUnmaximize = window.suriElectron.onUnmaximize(handleUnmaximize)
    }

    return () => {
      if (cleanupMaximize) cleanupMaximize()
      if (cleanupUnmaximize) cleanupUnmaximize()
    }
  }, [])

  const handleMinimize = () => {
    if (window.suriElectron) {
      window.suriElectron.minimize()
    }
  }

  const handleMaximize = () => {
    if (window.suriElectron) {
      window.suriElectron.maximize()
    }
  }

  const handleClose = () => {
    if (window.suriElectron) {
      window.suriElectron.close()
    }
  }

  return (
    <div 
      className="h-8 bg-black/95 backdrop-blur-xl border-b border-white/[0.05] flex items-center justify-between px-4 select-none flex-shrink-0"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Drag Region - Left Side */}
      <div className="flex items-center space-x-3 flex-1">
        <div className="w-3 h-3 rounded-full bg-white/20"></div>
        <span className="text-xs text-white/60 font-light tracking-wider uppercase">
          {title}
        </span>
      </div>

      {/* Window Controls - Right Side */}
      <div 
        className="flex items-center space-x-1"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button
          onClick={handleMinimize}
          className="titlebar-btn w-7 h-7 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.08] rounded transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 16 16" strokeWidth={1.2}>
            <path d="M4 8h8" strokeLinecap="round" />
          </svg>
        </button>

        <button
          onClick={handleMaximize}
          className="titlebar-btn w-7 h-7 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.08] rounded transition-all duration-200"
        >
          {isMaximized ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 16 16" strokeWidth={1.2}>
              <path d="M5 3h8v8M3 5h8v8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 16 16" strokeWidth={1.2}>
              <rect x="3" y="3" width="10" height="10" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        <button
          onClick={handleClose}
          className="titlebar-btn w-7 h-7 flex items-center justify-center text-white/50 hover:text-white hover:bg-red-500/15 rounded transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 16 16" strokeWidth={1.2}>
            <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}
