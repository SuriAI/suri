export function AppSkeleton() {
  return (
    <div className="h-full flex flex-col overflow-hidden bg-black">
      <div className="flex-1 flex min-h-0">
        {/* Main Content Area (Video Placeholder) */}
        <div className="flex-1 flex flex-col min-h-0 relative">
          <div className="flex-1 m-4 rounded-3xl border border-white/5 bg-white/5 flex items-center justify-center">
            <div className="text-white/20 flex flex-col items-center gap-4">
              <i className="fa-solid fa-camera text-4xl" />
              <span className="text-sm font-medium tracking-wider">
                SYSTEM INITIALIZING
              </span>
            </div>
          </div>

          {/* Control Bar Placeholder */}
          <div className="h-20 mx-auto mb-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10" />
            <div className="w-16 h-16 rounded-full bg-cyan-500/20 border border-cyan-500/40" />
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10" />
          </div>
        </div>

        {/* Sidebar Placeholder */}
        <div className="w-[360px] border-l border-white/10 bg-[#0a0a0a] flex flex-col p-4 gap-4">
          <div className="h-10 w-full bg-white/5 rounded-xl" />
          <div className="h-32 w-full bg-white/5 rounded-xl border border-white/5" />
          <div className="flex-1 w-full bg-white/5 rounded-xl border border-white/5 opacity-50" />
        </div>
      </div>
    </div>
  );
}
