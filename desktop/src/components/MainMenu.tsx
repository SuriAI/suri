import type { MenuOption } from '../App'

interface MainMenuProps {
  onMenuSelect: (menu: MenuOption) => void
  isConnected: boolean
  systemStats: {
    legacy_faces: number
    enhanced_templates: number
    total_people: number
    today_records: number
    total_records: number
    success_rate: number
  } | null
  onRefreshStats: () => void
}

export default function MainMenu({ 
  onMenuSelect, 
  isConnected, 
  systemStats,
  onRefreshStats 
}: MainMenuProps) {
  const menuItems = [
    {
      id: 'live-camera' as MenuOption,
      icon: '📹',
      title: 'Live Camera',
      description: 'Real-time face recognition',
      disabled: !isConnected
    },
    {
      id: 'single-image' as MenuOption,
      icon: '🖼️',
      title: 'Single Image',
      description: 'Upload and analyze images',
      disabled: !isConnected
    },
    {
      id: 'batch-processing' as MenuOption,
      icon: '📁',
      title: 'Batch Processing',
      description: 'Process multiple images',
      disabled: !isConnected
    },
    {
      id: 'system-management' as MenuOption,
      icon: '⚙️',
      title: 'System Management',
      description: 'Manage people and settings',
      disabled: !isConnected
    }
  ]

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* System Status Card */}
      <section className="bg-gray-900/50 border border-gray-800 rounded-lg backdrop-blur-sm">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-white tracking-wide">System Status</h2>
            <button
              onClick={onRefreshStats}
              className="text-xs text-gray-400 hover:text-white transition-colors duration-200 px-3 py-1.5 rounded border border-gray-800 hover:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!isConnected}
            >
              Refresh
            </button>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-black/30 border border-gray-800 rounded p-4 text-center">
              <div className="text-2xl font-mono text-white mb-1">{systemStats?.total_people ?? '—'}</div>
              <div className="text-xs text-gray-400 uppercase tracking-wide">People</div>
            </div>
            <div className="bg-black/30 border border-gray-800 rounded p-4 text-center">
              <div className="text-2xl font-mono text-white mb-1">{systemStats?.enhanced_templates ?? '—'}</div>
              <div className="text-xs text-gray-400 uppercase tracking-wide">Templates</div>
            </div>
            <div className="bg-black/30 border border-gray-800 rounded p-4 text-center">
              <div className="text-2xl font-mono text-white mb-1">{systemStats?.today_records ?? '—'}</div>
              <div className="text-xs text-gray-400 uppercase tracking-wide">Today</div>
            </div>
            <div className="bg-black/30 border border-gray-800 rounded p-4 text-center">
              <div className="text-2xl font-mono text-white mb-1">
                {systemStats ? (systemStats.success_rate * 100).toFixed(0) : '—'}%
              </div>
              <div className="text-xs text-gray-400 uppercase tracking-wide">Success</div>
            </div>
          </div>
        </div>
      </section>

      {/* Menu Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onMenuSelect(item.id)}
            disabled={item.disabled}
            className={`group relative bg-gray-900/30 border border-gray-800 rounded-lg p-6 text-left transition-all duration-200 hover:bg-gray-900/50 hover:border-gray-700 ${
              item.disabled 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:shadow-lg hover:shadow-gray-900/20'
            }`}
          >
            <div className="flex items-start space-x-4">
              <div className="text-2xl">{item.icon}</div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-medium mb-1 group-hover:text-gray-100 transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                  {item.description}
                </p>
              </div>
            </div>
            
            {item.disabled && (
              <div className="absolute top-3 right-3 flex items-center space-x-1 text-xs text-gray-500">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                <span>Connection required</span>
              </div>
            )}
            
            {!item.disabled && (
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="w-5 h-5 flex items-center justify-center text-gray-400 group-hover:text-white">
                  →
                </div>
              </div>
            )}
          </button>
        ))}
      </section>
    </div>
  )
}
