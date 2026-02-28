import { useState, useEffect } from "react";
import { Tooltip } from "@/components/shared";

export default function WindowBar() {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const handleMaximize = () => setIsMaximized(true);
    const handleUnmaximize = () => setIsMaximized(false);

    let cleanupMaximize: (() => void) | undefined;
    let cleanupUnmaximize: (() => void) | undefined;

    if (window.suriElectron) {
      cleanupMaximize = window.suriElectron.onMaximize(handleMaximize);
      cleanupUnmaximize = window.suriElectron.onUnmaximize(handleUnmaximize);
    }

    return () => {
      if (cleanupMaximize) cleanupMaximize();
      if (cleanupUnmaximize) cleanupUnmaximize();
    };
  }, []);

  const handleMinimize = () => {
    if (window.suriElectron) {
      window.suriElectron.minimize();
    }
  };

  const handleMaximize = () => {
    if (window.suriElectron) {
      window.suriElectron.maximize();
    }
  };

  const handleClose = () => {
    if (window.suriElectron) {
      window.suriElectron.close();
    }
  };

  return (
    <div
      className="w-full h-[32px] flex items-center justify-between select-none flex-shrink-0 relative"
      style={
        {
          WebkitAppRegion: isMaximized ? "no-drag" : "drag",
        } as React.CSSProperties
      }
    >
      <div className="absolute inset-0 bg-black/90 border-b border-white/[0.06] z-40 pointer-events-none"></div>

      <div className="flex items-center ml-4 space-x-3 flex-1 relative z-40 pointer-events-none">
        <img
          src="./icons/suri_mark_logo_transparent.png"
          alt="Suri"
          className="w-8 h-8 object-contain opacity-90 -ml-3 mr-1"
        />

        <div className="flex items-center space-x-2">
          <span className="text-white font-semibold text-[13px] tracking-wide">
            Suri
          </span>
          <span className="w-1 h-3 border-r border-white/10"></span>
          <span className="text-[11px] font-medium tracking-wide bg-gradient-to-r from-white/60 to-white/40 bg-clip-text text-transparent">
            AI-powered Attendance Tracker
          </span>
        </div>
      </div>

      <div
        className="flex items-center h-full relative z-[70] [webkit-app-region:no-drag]"
        style={
          {
            WebkitAppRegion: "no-drag",
            fontFamily: '"Segoe MDL2 Assets", Arial, sans-serif',
          } as React.CSSProperties
        }
      >
        <Tooltip content="Minimize" position="bottom">
          <button
            onClick={handleMinimize}
            className="w-[46px] h-full flex items-center justify-center text-white/70 hover:bg-white/[0.08] transition-colors duration-150 border-none bg-transparent p-0 text-[10px]"
          >
            &#xE921;
          </button>
        </Tooltip>

        <Tooltip
          content={isMaximized ? "Restore" : "Maximize"}
          position="bottom"
        >
          <button
            onClick={handleMaximize}
            className="w-[46px] outline-none h-full flex items-center justify-center text-white/70 hover:bg-white/[0.08] transition-colors duration-150 border-none bg-transparent p-0 text-[10px]"
          >
            {isMaximized ? <>&#xE923;</> : <>&#xE922;</>}
          </button>
        </Tooltip>

        <Tooltip content="Close" position="bottom">
          <button
            onClick={handleClose}
            className="w-[46px] outline-none h-full flex items-center justify-center text-white/70 hover:bg-[#e81123] hover:text-white transition-colors duration-150 border-none bg-transparent p-0 text-[10px]"
          >
            &#xE8BB;
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
