import { useState, useEffect, useRef, useCallback } from 'react'

interface LiveCameraRecognitionProps {
  onBack: () => void
}

interface RecognitionResult {
  name: string | null
  confidence: number
  bbox: [number, number, number, number]
  quality: number
  method: string
  shouldLog: boolean
}

interface AttendanceRecord {
  name: string
  timestamp: string
  confidence: number
  time: string
}

export default function LiveCameraRecognition({ onBack }: LiveCameraRecognitionProps) {
  const [isStreaming, setIsStreaming] = useState(false)
  const [recognitionResults] = useState<RecognitionResult[]>([])
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([])
  const [showAddPerson, setShowAddPerson] = useState(false)
  const [newPersonName, setNewPersonName] = useState('')
  const [isAddingPerson, setIsAddingPerson] = useState(false)
  const [systemStats, setSystemStats] = useState({ today_records: 0, total_people: 0 })
  
  const imgRef = useRef<HTMLImageElement>(null)
  const frameUrlRef = useRef<string | null>(null)
  const streamingRef = useRef(false)
  const wsUnsubRef = useRef<(() => void) | null>(null)

  const connectWebSocket = useCallback(() => {
    try {
      // Use preload-exposed client so it reconnects automatically
      if (window.suriWS) {
        window.suriWS.connect('ws://127.0.0.1:8770/ws')
        const isAttendance = (m: Record<string, unknown>): m is { type: string; records: AttendanceRecord[] } => {
          const maybeType = m?.['type']
          const maybeRecs = (m as unknown as { records?: unknown }).records
          return maybeType === 'attendance_logged' && Array.isArray(maybeRecs)
        }
        wsUnsubRef.current = window.suriWS.onMessage((msg) => {
          if (isAttendance(msg)) {
            setTodayAttendance(prev => [...prev, ...msg.records])
          }
        })
      }
    } catch (error) {
      console.error('WebSocket connection failed:', error)
    }
  }, [])

  const fetchTodayAttendance = useCallback(async () => {
    try {
  const response = await fetch('http://127.0.0.1:8770/attendance/today')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setTodayAttendance(data.records)
          setSystemStats(prev => ({ ...prev, today_records: data.records.length }))
        }
      }
    } catch (error) {
      console.error('Failed to fetch attendance:', error)
    }
  }, [])

  const stopStream = useCallback(async () => {
    try {
      setIsStreaming(false)
      streamingRef.current = false
      // Clean up blob URL if exists
      if (imgRef.current && imgRef.current.src) {
        if (imgRef.current.src.startsWith('blob:')) URL.revokeObjectURL(imgRef.current.src)
        imgRef.current.src = ''
        frameUrlRef.current = null
      }
      // unsubscribe frame listener if any
      if (window.__suriOffFrame) {
        try { window.__suriOffFrame() } catch (e) { console.warn('offFrame cleanup error', e) }
        window.__suriOffFrame = undefined
      }
      if (window.suriVideo) await window.suriVideo.stop()
    } catch (error) {
      console.error('Failed to stop stream:', error)
    }
  }, [])

  const startStream = useCallback(async () => {
    try {
      await stopStream()
    if (!window.suriVideo) throw new Error('suriVideo API not available')
    await window.suriVideo.start({ device: 0, annotate: true })
  let lastSet = 0
  const offFrame = window.suriVideo.onFrame((buf) => {
        try {
          const u8 = (buf instanceof ArrayBuffer) ? new Uint8Array(buf) : (buf as Uint8Array)
          const ab = new ArrayBuffer(u8.byteLength)
          new Uint8Array(ab).set(u8)
          const blob = new Blob([ab], { type: 'image/jpeg' })
          const url = URL.createObjectURL(blob)
          if (imgRef.current) {
            const now = performance.now()
            if (now - lastSet < 12) { // ~80 fps guard; avoid thrash
              URL.revokeObjectURL(url)
              return
            }
            if (frameUrlRef.current) URL.revokeObjectURL(frameUrlRef.current)
            frameUrlRef.current = url
            imgRef.current.src = url
            lastSet = now
          }
        } catch (e) {
          console.error('onFrame error', e)
        }
      })
      // Keep unsubscriber in ref to cleanup when stopping
    window.__suriOffFrame = offFrame
      setIsStreaming(true)
      streamingRef.current = true
    } catch (error) {
      console.error('Failed to start stream:', error)
      setIsStreaming(false)
      streamingRef.current = false
    }
  }, [stopStream])

  useEffect(() => {
    connectWebSocket()
    fetchTodayAttendance()
    
    return () => {
      if (wsUnsubRef.current) wsUnsubRef.current()
      stopStream()
    }
  }, [connectWebSocket, fetchTodayAttendance, stopStream])

  const addPersonFromCamera = async () => {
    if (!newPersonName.trim()) return
    
    setIsAddingPerson(true)
    try {
      const form = new FormData()
      form.append('name', newPersonName.trim())
      form.append('device', String(0))
      form.append('multi_template', String(true))
      const response = await fetch('http://127.0.0.1:8770/person/add-from-camera', {
        method: 'POST',
        body: form
      })
      
      const data = await response.json()
      if (data.success) {
        alert(`✅ ${newPersonName} added successfully!`)
        setNewPersonName('')
        setShowAddPerson(false)
        fetchSystemStats()
      } else {
        alert(`❌ Failed to add ${newPersonName}: ${data.message}`)
      }
    } catch (error) {
      console.error('Add person error:', error)
      alert('❌ Failed to add person due to connection error')
    } finally {
      setIsAddingPerson(false)
    }
  }

  const fetchSystemStats = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8770/system/status')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setSystemStats({
            today_records: data.attendance_stats?.today_records ?? 0,
            total_people: data.database_stats?.total_people ?? 0
          })
        }
      }
    } catch (error) {
      console.error('Failed to fetch system stats:', error)
    }
  }

  const clearAttendance = async () => {
    if (!confirm('⚠️ Clear ALL attendance records? This cannot be undone.')) return
    
    try {
  const response = await fetch('http://127.0.0.1:8770/attendance/clear', {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setTodayAttendance([])
        alert('✅ Attendance log cleared!')
      }
    } catch (error) {
      console.error('Failed to clear attendance:', error)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black/50 backdrop-blur-xl">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <button 
              onClick={onBack} 
              className="text-xs text-gray-400 hover:text-white transition-colors duration-200 px-2 py-1 rounded border border-gray-800 hover:border-gray-600"
            >
              ← Back
            </button>
            <h1 className="text-lg font-medium tracking-wide">Live Camera</h1>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={isStreaming ? stopStream : startStream}
              className={`px-4 py-2 rounded text-xs font-medium transition-all duration-200 ${
                isStreaming 
                  ? 'bg-red-900/50 border border-red-800 text-red-200 hover:bg-red-900/70'
                  : 'bg-green-900/50 border border-green-800 text-green-200 hover:bg-green-900/70'
              }`}
            >
              {isStreaming ? 'Stop' : 'Start'}
            </button>
            
            {isStreaming && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => { window.suriVideo?.pause() }}
                  className="px-3 py-2 rounded text-xs text-gray-400 hover:text-white border border-gray-800 hover:border-gray-600 transition-all duration-200"
                >
                  Pause
                </button>
                <button
                  onClick={() => { window.suriVideo?.resume() }}
                  className="px-3 py-2 rounded text-xs text-gray-400 hover:text-white border border-gray-800 hover:border-gray-600 transition-all duration-200"
                >
                  Resume
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Status Bar */}
      <section className="border-b border-gray-800 bg-gray-900/30">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-400 uppercase tracking-wide">Status</span>
              <div className={`flex items-center space-x-1.5 text-xs ${isStreaming ? 'text-green-400' : 'text-gray-500'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${isStreaming ? 'bg-green-400' : 'bg-gray-500'}`}></div>
                <span>{isStreaming ? 'Live' : 'Stopped'}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-400 uppercase tracking-wide">Today</span>
              <span className="text-sm font-mono text-white">{systemStats.today_records}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAddPerson(true)}
              disabled={!isStreaming}
              className="px-3 py-1.5 rounded text-xs text-gray-400 hover:text-white border border-gray-800 hover:border-gray-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Person
            </button>
            
            <button
              onClick={fetchTodayAttendance}
              className="px-3 py-1.5 rounded text-xs text-gray-400 hover:text-white border border-gray-800 hover:border-gray-600 transition-all duration-200"
            >
              Refresh
            </button>
            
            <button
              onClick={clearAttendance}
              className="px-3 py-1.5 rounded text-xs text-red-400 hover:text-red-300 border border-red-900 hover:border-red-800 transition-all duration-200"
            >
              Clear Log
            </button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="flex flex-1 h-[calc(100vh-140px)]">
        {/* Video Feed */}
        <section className="flex-1 p-6">
          <div className="h-full bg-gray-900/30 border border-gray-800 rounded-lg overflow-hidden">
            {isStreaming ? (
              <div className="relative h-full">
                <img
                  ref={imgRef}
                  className="w-full h-full object-contain bg-black"
                  alt="Live camera feed"
                />
                
                {/* Recognition Overlays */}
                {recognitionResults.length > 0 && (
                  <div className="absolute inset-0 pointer-events-none">
                    {recognitionResults.map((result, index) => (
                      <div
                        key={index}
                        className={`absolute top-4 left-4 px-3 py-2 rounded backdrop-blur-md text-xs ${
                          result.shouldLog 
                            ? 'bg-green-900/80 border border-green-800 text-green-200' 
                            : result.name 
                              ? 'bg-yellow-900/80 border border-yellow-800 text-yellow-200' 
                              : 'bg-red-900/80 border border-red-800 text-red-200'
                        }`}
                      >
                        <div className="font-medium">
                          {result.name || 'Unknown'} ({(result.confidence * 100).toFixed(1)}%)
                        </div>
                        <div className="text-xs opacity-75">
                          Q: {result.quality.toFixed(2)} | {result.method}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-4 opacity-50">📹</div>
                  <h3 className="text-lg font-medium text-white mb-2">Camera Inactive</h3>
                  <p className="text-sm text-gray-400">Click Start to begin recognition</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Attendance Panel */}
        <section className="w-80 border-l border-gray-800 bg-gray-900/20">
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-gray-800">
              <h3 className="text-sm font-medium text-white tracking-wide">Today's Attendance</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {todayAttendance.length > 0 ? (
                <div className="space-y-1 p-2">
                  {todayAttendance.slice().reverse().map((record, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-black/30 border border-gray-800 rounded">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-white truncate">{record.name}</div>
                        <div className="text-xs text-gray-400">{record.time}</div>
                      </div>
                      <div className="text-xs font-mono text-gray-300 ml-2">
                        {(record.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-center p-6">
                  <div>
                    <div className="text-2xl mb-2 opacity-50">📝</div>
                    <p className="text-sm text-gray-400">No records today</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Add Person Modal */}
      {showAddPerson && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 w-96 max-w-full mx-4">
            <h3 className="text-lg font-medium text-white mb-4">Add New Person</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Person's Name</label>
                <input
                  type="text"
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full px-3 py-2 bg-black border border-gray-800 rounded text-white placeholder-gray-500 focus:outline-none focus:border-gray-600"
                  disabled={isAddingPerson}
                />
              </div>
              
              <div className="text-xs text-gray-400 bg-gray-800/50 p-3 rounded">
                Position the person's face in the camera and click Add Person.
              </div>
              
              <div className="flex items-center space-x-3 pt-2">
                <button
                  onClick={addPersonFromCamera}
                  disabled={!newPersonName.trim() || isAddingPerson}
                  className="flex-1 px-4 py-2 bg-green-900/50 border border-green-800 text-green-200 rounded hover:bg-green-900/70 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAddingPerson ? 'Adding...' : 'Add Person'}
                </button>
                
                <button
                  onClick={() => {
                    setShowAddPerson(false)
                    setNewPersonName('')
                  }}
                  disabled={isAddingPerson}
                  className="px-4 py-2 text-gray-400 hover:text-white border border-gray-800 hover:border-gray-600 rounded transition-all duration-200 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

