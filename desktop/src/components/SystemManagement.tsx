import { useState, useEffect, useRef } from 'react'

interface SystemManagementProps {
  onBack: () => void
}

interface Person {
  name: string
  template_count: number
  last_seen: string | null
  confidence_threshold: number
  attendance_count: number
}

interface SystemStats {
  total_people: number
  template_quality: {
    excellent: number
    good: number
    fair: number
    poor: number
  }
  database_size: number
  last_backup: string | null
}

export default function SystemManagement({ onBack }: SystemManagementProps) {
  const [currentView, setCurrentView] = useState<'main' | 'people' | 'settings' | 'maintenance'>('main')
  const [people, setPeople] = useState<Person[]>([])
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null)
  const [newPersonName, setNewPersonName] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (currentView === 'people') {
      loadPeople()
    }
    if (currentView === 'main') {
      loadSystemStats()
    }
  }, [currentView])

  const loadPeople = async () => {
    try {
  const response = await fetch('http://127.0.0.1:8770/system/people')
      if (response.ok) {
        const data = await response.json()
        setPeople(data.people || [])
      }
    } catch (error) {
      console.error('Failed to load people:', error)
    }
  }

  const loadSystemStats = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8770/system/stats')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.stats) {
          const s = data.stats
          setSystemStats({
            total_people: s.people_count ?? s.total_people ?? 0,
            template_quality: {
              excellent: s.template_quality?.excellent ?? 0,
              good: s.template_quality?.good ?? 0,
              fair: s.template_quality?.fair ?? 0,
              poor: s.template_quality?.poor ?? 0,
            },
            database_size: s.database_size ?? 0,
            last_backup: s.last_backup ?? null,
          })
        }
      }
    } catch (error) {
      console.error('Failed to load system stats:', error)
    }
  }

  const addPerson = async () => {
    if (!newPersonName.trim() || !selectedFiles || selectedFiles.length === 0) {
      alert('Please enter a name and select at least one image')
      return
    }

    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('name', newPersonName.trim())
      
      for (let i = 0; i < selectedFiles.length; i++) {
        formData.append('images', selectedFiles[i])
      }

      // Backend supports /person/add (single) and /person/add-multi (multi templates)
      // We will choose add-multi when multiple files provided
      const endpoint = selectedFiles.length > 1 ? 'person/add-multi' : 'person/add'
      const fileField = selectedFiles.length > 1 ? 'files' : 'file'
      const response = await fetch(`http://127.0.0.1:8770/${endpoint}`, {
        method: 'POST',
        body: (() => { const fd = new FormData(); fd.append('name', newPersonName.trim());
          if (selectedFiles) {
            for (let i = 0; i < selectedFiles.length; i++) {
              fd.append(fileField, selectedFiles[i])
            }
          }
          return fd; })()
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          alert(`✅ Successfully added ${newPersonName} with ${data.templates_added} templates`)
          setNewPersonName('')
          setSelectedFiles(null)
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
          loadPeople()
        } else {
          alert(`❌ Failed to add person: ${data.message}`)
        }
      }
    } catch (error) {
      console.error('Failed to add person:', error)
      alert('❌ Failed to add person')
    } finally {
      setIsLoading(false)
    }
  }

  const deletePerson = async (personName: string) => {
    if (!confirm(`Are you sure you want to delete ${personName}? This action cannot be undone.`)) {
      return
    }

    setIsLoading(true)
    try {
  const response = await fetch(`http://127.0.0.1:8770/person/${encodeURIComponent(personName)}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          alert(`✅ Successfully deleted ${personName}`)
          loadPeople()
        } else {
          alert(`❌ Failed to delete person: ${data.message}`)
        }
      }
    } catch (error) {
      console.error('Failed to delete person:', error)
      alert('❌ Failed to delete person')
    } finally {
      setIsLoading(false)
    }
  }

  const updateConfidenceThreshold = async (personName: string, threshold: number) => {
    try {
  // No explicit endpoint exists in backend; skipping server update and only updating UI for now
  // You may implement /person/update-threshold server-side later
  const response = await fetch(`http://127.0.0.1:8770/person/update-threshold`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: personName,
          threshold: threshold
        })
      })

      if (response.ok) {
        loadPeople()
      }
    } catch (error) {
      console.error('Failed to update threshold:', error)
    }
  }

  const backupDatabase = async () => {
    setIsLoading(true)
    try {
  // Not implemented in backend; stub to maintain UI. Consider implementing endpoint later.
  const response = await fetch('http://127.0.0.1:8770/system/backup', {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          alert(`✅ Database backed up to: ${data.backup_path}`)
          loadSystemStats()
        } else {
          alert(`❌ Backup failed: ${data.message}`)
        }
      }
    } catch (error) {
      console.error('Backup failed:', error)
      alert('❌ Backup failed')
    } finally {
      setIsLoading(false)
    }
  }

  const optimizeTemplates = async () => {
    if (!confirm('This will optimize face templates. This may take some time. Continue?')) {
      return
    }

    setIsLoading(true)
    try {
  // Not implemented in backend; stub to maintain UI. Consider implementing endpoint later.
  const response = await fetch('http://127.0.0.1:8770/system/optimize-templates', {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          alert(`✅ Template optimization complete. Removed ${data.removed_count} low-quality templates`)
          loadSystemStats()
          loadPeople()
        } else {
          alert(`❌ Optimization failed: ${data.message}`)
        }
      }
    } catch (error) {
      console.error('Optimization failed:', error)
      alert('❌ Optimization failed')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredPeople = people.filter(person =>
    person.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const renderMainView = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">System Overview</h2>
      
      {systemStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-400">{systemStats.total_people}</div>
            <div className="text-sm text-slate-400">Total People</div>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-400">
              {systemStats.template_quality.excellent + systemStats.template_quality.good}
            </div>
            <div className="text-sm text-slate-400">Quality Templates</div>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-400">
              {(systemStats.database_size / 1024 / 1024).toFixed(1)} MB
            </div>
            <div className="text-sm text-slate-400">Database Size</div>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-400">
              {systemStats.last_backup ? new Date(systemStats.last_backup).toLocaleDateString() : 'Never'}
            </div>
            <div className="text-sm text-slate-400">Last Backup</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <button
          onClick={() => setCurrentView('people')}
          className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-xl transition-colors text-left"
        >
          <div className="text-2xl mb-2">👥</div>
          <div className="font-semibold">Manage People</div>
          <div className="text-sm opacity-80">Add, remove, and edit people in the database</div>
        </button>

        <button
          onClick={() => setCurrentView('settings')}
          className="bg-green-600 hover:bg-green-700 text-white p-6 rounded-xl transition-colors text-left"
        >
          <div className="text-2xl mb-2">⚙️</div>
          <div className="font-semibold">System Settings</div>
          <div className="text-sm opacity-80">Configure recognition parameters</div>
        </button>

        <button
          onClick={() => setCurrentView('maintenance')}
          className="bg-purple-600 hover:bg-purple-700 text-white p-6 rounded-xl transition-colors text-left"
        >
          <div className="text-2xl mb-2">🔧</div>
          <div className="font-semibold">Maintenance</div>
          <div className="text-sm opacity-80">Backup, optimize, and maintain the system</div>
        </button>
      </div>
    </div>
  )

  const renderPeopleView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">👥 People Management</h2>
        <input
          type="text"
          placeholder="Search people..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Add New Person */}
      <div className="bg-slate-700/50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Add New Person</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <input
              type="text"
              placeholder="Person's name"
              value={newPersonName}
              onChange={(e) => setNewPersonName(e.target.value)}
              className="flex-1 px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setSelectedFiles(e.target.files)}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              📁 Select Images
            </button>
            <button
              onClick={addPerson}
              disabled={isLoading || !newPersonName.trim() || !selectedFiles}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {isLoading ? '⏳ Adding...' : '➕ Add Person'}
            </button>
          </div>
          {selectedFiles && (
            <div className="text-sm text-slate-300">
              {selectedFiles.length} image(s) selected
            </div>
          )}
        </div>
      </div>

      {/* People List */}
      <div className="space-y-3">
        {filteredPeople.map((person) => (
          <div
            key={person.name}
            className="bg-slate-700/50 rounded-lg p-4 border border-slate-600"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-4">
                  <h4 className="font-semibold text-white">{person.name}</h4>
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-sm">
                    {person.template_count} templates
                  </span>
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-sm">
                    {person.attendance_count} attendances
                  </span>
                </div>
                <div className="mt-2 text-sm text-slate-400">
                  Last seen: {person.last_seen ? new Date(person.last_seen).toLocaleString() : 'Never'}
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-sm">
                  <label className="block text-slate-400 mb-1">Confidence Threshold</label>
                  <input
                    type="range"
                    min="0.3"
                    max="1.0"
                    step="0.05"
                    value={person.confidence_threshold}
                    onChange={(e) => updateConfidenceThreshold(person.name, parseFloat(e.target.value))}
                    className="w-20"
                  />
                  <div className="text-center text-white">{(person.confidence_threshold * 100).toFixed(0)}%</div>
                </div>
                
                <button
                  onClick={() => deletePerson(person.name)}
                  disabled={isLoading}
                  className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPeople.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          {searchTerm ? 'No people found matching your search.' : 'No people in the database.'}
        </div>
      )}
    </div>
  )

  const renderMaintenanceView = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">🔧 System Maintenance</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-700/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">📁 Database Backup</h3>
          <p className="text-slate-300 mb-4">
            Create a backup of the face database and templates.
          </p>
          <button
            onClick={backupDatabase}
            disabled={isLoading}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
          >
            {isLoading ? '⏳ Creating Backup...' : '💾 Create Backup'}
          </button>
        </div>

        <div className="bg-slate-700/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">🎯 Optimize Templates</h3>
          <p className="text-slate-300 mb-4">
            Remove low-quality face templates to improve recognition accuracy.
          </p>
          <button
            onClick={optimizeTemplates}
            disabled={isLoading}
            className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
          >
            {isLoading ? '⏳ Optimizing...' : '⚡ Optimize Templates'}
          </button>
        </div>
      </div>

      {systemStats && (
        <div className="bg-slate-700/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">📊 Template Quality Distribution</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{systemStats.template_quality.excellent}</div>
              <div className="text-sm text-slate-400">Excellent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{systemStats.template_quality.good}</div>
              <div className="text-sm text-slate-400">Good</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{systemStats.template_quality.fair}</div>
              <div className="text-sm text-slate-400">Fair</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{systemStats.template_quality.poor}</div>
              <div className="text-sm text-slate-400">Poor</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={currentView === 'main' ? onBack : () => setCurrentView('main')}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            ← {currentView === 'main' ? 'Back' : 'Main'}
          </button>
          <h1 className="text-2xl font-bold text-white">
            ⚙️ System Management
            {currentView !== 'main' && (
              <span className="text-lg font-normal text-slate-400 ml-2">
                / {currentView.charAt(0).toUpperCase() + currentView.slice(1)}
              </span>
            )}
          </h1>
        </div>
      </div>

      {/* Content */}
      {currentView === 'main' && renderMainView()}
      {currentView === 'people' && renderPeopleView()}
      {currentView === 'maintenance' && renderMaintenanceView()}
    </div>
  )
}
