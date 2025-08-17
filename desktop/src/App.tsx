import { useState, useEffect, useCallback } from 'react'
import MainMenu from './components/MainMenu.tsx'
import LiveCameraRecognition from './components/LiveCameraRecognition.tsx'
import SingleImageRecognition from './components/SingleImageRecognition.tsx'
import BatchImageProcessing from './components/BatchImageProcessing.tsx'
import SystemManagement from './components/SystemManagement.tsx'
import './App.css'

export type MenuOption = 
  | 'main'
  | 'live-camera'
  | 'single-image'
  | 'batch-processing'
  | 'system-management'

function App() {
  const [currentMenu, setCurrentMenu] = useState<MenuOption>('main') // Back to main menu
  const [isConnected, setIsConnected] = useState(false)
  const [systemStats, setSystemStats] = useState({
    legacy_faces: 0,
    enhanced_templates: 0,
    total_people: 0,
    today_records: 0,
    total_records: 0,
    success_rate: 0
  })

  const fetchSystemStats = useCallback(async () => {
    try {
      const response = await fetch('http://127.0.0.1:8770/system/stats')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const stats = data.stats
          setSystemStats({
            legacy_faces: stats.legacy_faces || 0,
            enhanced_templates: stats.template_count || 0,
            total_people: stats.people_count || 0,
            today_records: stats.today_attendance || 0,
            total_records: stats.total_attendance || 0,
            success_rate: stats.success_rate || 0
          })
        }
      }
    } catch (error) {
      console.error('Failed to fetch system stats:', error)
    }
  }, [])

  const preloadCamera = useCallback(async () => {
    try {
      console.log('Preloading camera models for instant startup...')
      // Warm up the ONNX models by making a preload request
      const response = await fetch('http://127.0.0.1:8770/system/preload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      if (response.ok) {
        console.log('Camera models preloaded successfully')
      } else {
        console.log('Camera preload endpoint not available (normal)')
      }
    } catch (error) {
      console.log('Camera preload failed (models will load on first use):', error)
    }
  }, [])

  useEffect(() => {
    // Initialize connection on app start with retry
    const initializeConnection = async () => {
      const maxRetries = 5
      const retryDelay = 1000 // 1 second
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          // Test connection to backend
          const response = await fetch('http://127.0.0.1:8770/')
          if (response.ok) {
            setIsConnected(true)
            fetchSystemStats()
            console.log(`Backend connected on attempt ${attempt}`)
            
            // Preload camera for instant startup later
            preloadCamera()
            return
          }
        } catch (error) {
          console.log(`Backend connection attempt ${attempt}/${maxRetries} failed:`, error)
        }
        
        // Wait before retry (except on last attempt)
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay))
        }
      }
      
      console.error('Backend connection failed after all attempts')
      setIsConnected(false)
    }
    
    initializeConnection()
  }, [fetchSystemStats, preloadCamera])

  const renderCurrentComponent = () => {
    switch (currentMenu) {
      case 'live-camera':
        return <LiveCameraRecognition onBack={() => setCurrentMenu('main')} />
      case 'single-image':
        return <SingleImageRecognition onBack={() => setCurrentMenu('main')} />
      case 'batch-processing':
        return <BatchImageProcessing onBack={() => setCurrentMenu('main')} />
      case 'system-management':
        return <SystemManagement onBack={() => setCurrentMenu('main')} />
      default:
        return (
          <MainMenu 
            onMenuSelect={setCurrentMenu}
            isConnected={isConnected}
            systemStats={systemStats}
            onRefreshStats={fetchSystemStats}
          />
        )
    }
  }

  return (
    <div className="min-h-screen bg-black text-white font-mono">
      {/* Ultra-sleek header bar */}
      <div className="border-b border-gray-800 bg-black/50 backdrop-blur-xl">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-white"></div>
              <span className="text-sm font-medium tracking-wide">SURI</span>
            </div>
            {currentMenu !== 'main' && (
              <button
                onClick={() => setCurrentMenu('main')}
                className="text-xs text-gray-400 hover:text-white transition-colors duration-200 px-2 py-1 rounded border border-gray-800 hover:border-gray-600"
              >
                ← Back
              </button>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className="text-xs text-gray-400">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="relative">
        {renderCurrentComponent()}
      </div>
    </div>
  )
}

export default App
