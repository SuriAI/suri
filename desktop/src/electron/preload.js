const { contextBridge, ipcRenderer } = require('electron')

// Face Log Database API
contextBridge.exposeInMainWorld('electronAPI', {
    logDetection: (detection) => {
        return ipcRenderer.invoke('face-db:log-detection', detection)
    },
    getRecentLogs: (limit) => {
        return ipcRenderer.invoke('face-db:get-recent-logs', limit)
    },
    getTodayStats: () => {
        return ipcRenderer.invoke('face-db:get-today-stats')
    },
    exportData: (filePath) => {
        return ipcRenderer.invoke('face-db:export-data', filePath)
    },
    clearOldData: (daysToKeep) => {
        return ipcRenderer.invoke('face-db:clear-old-data', daysToKeep)
    },
    // Person Management API
    getAllPeople: () => {
        return ipcRenderer.invoke('face-db:get-all-people')
    },
    getPersonLogs: (personId, limit) => {
        return ipcRenderer.invoke('face-db:get-person-logs', personId, limit)
    },
    updatePersonId: (oldPersonId, newPersonId) => {
        return ipcRenderer.invoke('face-db:update-person-id', oldPersonId, newPersonId)
    },
    deletePersonRecords: (personId) => {
        return ipcRenderer.invoke('face-db:delete-person', personId)
    },
    getPersonStats: (personId) => {
        return ipcRenderer.invoke('face-db:get-person-stats', personId)
    }
})

// Window control functions
contextBridge.exposeInMainWorld('suriElectron', {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    onMaximize: (callback) => {
        const listener = () => callback()
        ipcRenderer.on('window:maximized', listener)
        return () => ipcRenderer.removeListener('window:maximized', listener)
    },
    onUnmaximize: (callback) => {
        const listener = () => callback()
        ipcRenderer.on('window:unmaximized', listener)
        return () => ipcRenderer.removeListener('window:unmaximized', listener)
    }
})