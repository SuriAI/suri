import { app, BrowserWindow, ipcMain } from "electron"
import path from "path"
import isDev from "./util.js";
import { spawn, ChildProcessWithoutNullStreams } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import fs from 'fs'
import { FaceRecognitionPipeline } from "../services/FaceRecognitionPipeline.js";

let backendProc: ChildProcessWithoutNullStreams | null = null
let videoProc: ChildProcessWithoutNullStreams | null = null
let mainWindowRef: BrowserWindow | null = null
let faceRecognitionPipeline: FaceRecognitionPipeline | null = null
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function resolvePythonCmd(): string {
    const possiblePythonPaths = [
        path.join(app.getAppPath(), '..', 'venv', 'Scripts', 'python.exe'), // Windows venv
        path.join(app.getAppPath(), '..', 'venv', 'bin', 'python'), // Unix venv
        'python' // System python fallback
    ]
    for (const pythonPath of possiblePythonPaths) {
        if (pythonPath !== 'python' && fs.existsSync(pythonPath)) {
            console.log('[py] Using virtual environment python:', pythonPath)
            return pythonPath
        }
    }
    return 'python'
}

function startBackend(): void {
    try {
        const args = [
            '-m', 'uvicorn',
            'src.api.api_server:app',
            '--host', '127.0.0.1',
            '--port', '8770'
        ]
        
        // Try to use virtual environment python first, fallback to system python
        const pythonCmd = resolvePythonCmd()
        
        backendProc = spawn(pythonCmd, args, {
            cwd: path.join(app.getAppPath(), '..'),
            env: { ...process.env },
            stdio: 'pipe'
        })

        backendProc.stdout.on('data', (d) => console.log('[py][out]', d.toString()))
        backendProc.stderr.on('data', (d) => console.error('[py][err]', d.toString()))
        backendProc.on('exit', (code, signal) => {
            console.log('[py] exited', { code, signal })
            backendProc = null
        })
    } catch (err) {
        console.error('[py] Failed to start backend:', err)
        backendProc = null
    }
}

function stopBackend() {
    if (!backendProc) return
    try {
        if (process.platform === 'win32') {
            // Best-effort kill on Windows
            spawn('taskkill', ['/pid', String(backendProc.pid), '/f', '/t'])
        } else {
            backendProc.kill('SIGTERM')
        }
    } catch {
        // ignore errors when stopping backend
    }
    backendProc = null
}

function startVideo(opts?: { device?: number, annotate?: boolean, fastPreview?: boolean }) {
    if (videoProc) return
    const pythonCmd = resolvePythonCmd()
    const args = [
        '-m',
        'src.api.video_worker',
        '--device', String(opts?.device ?? 0)
    ]
    if (opts?.annotate === false) args.push('--no-annotate')
    if (opts?.fastPreview === true) args.push('--fast-preview')

    const cwd = path.join(app.getAppPath(), '..')
    console.log('[video] starting with args:', args)
    videoProc = spawn(pythonCmd, args, { 
        cwd, 
        env: { ...process.env }, 
        stdio: 'pipe'
    })
    console.log('[video] spawned', pythonCmd, args.join(' '))

    // Real-time frame handling with zero buffering
    let acc: Buffer = Buffer.alloc(0)
    let frameCount = 0
    let lastFrameTime = Date.now()

    function handleData(chunk: Buffer) {
        const maxSize = 2 * 1024 * 1024  // 2MB for higher resolution frames
        try {
            acc = Buffer.concat([acc, chunk])
            
            // Process all available frames immediately
            while (acc.length >= 4) {
                const len = acc.readUInt32LE(0)
                
                // Strict sanity check for frame size
                if (len <= 0 || len > maxSize) {
                    console.warn('[video] invalid frame length, resetting buffer', { len, bufferSize: acc.length })
                    acc = Buffer.alloc(0)
                    break
                }
                
                if (acc.length < 4 + len) break
                
                try {
                    // Extract frame data immediately
                    const frame = Buffer.from(acc.subarray(4, 4 + len))
                    acc = acc.subarray(4 + len)
                    
                    // Send frame immediately with zero buffering
                    if (mainWindowRef) {
                        // Use setImmediate for maximum real-time performance
                        setImmediate(() => {
                            mainWindowRef?.webContents.send('video:frame', frame)
                        })
                    }
                    
                    // Update frame statistics
                    frameCount++
                    const now = Date.now()
                    if (now - lastFrameTime >= 1000) {
                        const fps = frameCount
                        console.log(`[video] Real-time FPS: ${fps}`)
                        frameCount = 0
                        lastFrameTime = now
                    }
                    
                } catch (e) {
                    console.error('[video] frame processing error:', e)
                    acc = Buffer.alloc(0)
                    break
                }
            }
            
            // Safety check - if buffer gets too large, reset it
            if (acc.length > maxSize) {
                console.warn('[video] buffer overflow, resetting')
                acc = Buffer.alloc(0)
            }
        } catch (e) {
            console.error('[video] buffer handling error:', e)
            acc = Buffer.alloc(0)
        }
    }

    videoProc.stdout.on('data', (d: Buffer) => handleData(d))
    videoProc.stderr.on('data', (d: Buffer) => {
        const text = d.toString()
        // Forward structured events prefixed with EVT to renderer
        text.split(/\r?\n/).forEach(line => {
            if (!line) return
            if (line.startsWith('EVT ')) {
                try {
                    const evt = JSON.parse(line.slice(4))
                    if (mainWindowRef) mainWindowRef.webContents.send('video:event', evt)
                } catch (e) {
                    console.error('[video][evt-parse]', e)
                }
            } else if (line.startsWith('WS_BROADCAST ')) {
                try {
                    const wsEvent = JSON.parse(line.slice(13)) // Remove 'WS_BROADCAST ' prefix
                    if (mainWindowRef) mainWindowRef.webContents.send('websocket:broadcast', wsEvent)
                } catch (e) {
                    console.error('[video][ws-parse]', e)
                }
            } else {
                console.log('[video][err]', line)
            }
        })
    })
    videoProc.on('exit', (code, signal) => {
        console.log('[video] exited', { code, signal })
        videoProc = null
    })
}

function stopVideo() {
    if (!videoProc) return
    try {
        // attempt graceful stop via stdin control
        videoProc.stdin.write(JSON.stringify({ action: 'stop' }) + '\n')
        setTimeout(() => {
            if (!videoProc) return
            try {
                if (process.platform === 'win32') {
                    spawn('taskkill', ['/pid', String(videoProc.pid), '/f', '/t'])
                } else {
                    videoProc.kill('SIGTERM')
                }
            } catch (e) {
                console.warn('[video] forced stop error', e)
            }
        }, 500)
    } catch (e) {
        console.warn('[video] stopVideo error', e)
    }
}

// IPC bridge for renderer controls
ipcMain.handle('video:start', (_evt, opts) => { startVideo(opts); return true })
ipcMain.handle('video:start-fast', (_evt, opts) => { startVideo({...opts, fastPreview: true}); return true })
ipcMain.handle('video:stop', () => { stopVideo(); return true })
ipcMain.handle('video:pause', () => { if (videoProc) videoProc.stdin.write(JSON.stringify({ action: 'pause' }) + '\n'); return true })
ipcMain.handle('video:resume', () => { if (videoProc) videoProc.stdin.write(JSON.stringify({ action: 'resume' }) + '\n'); return true })
ipcMain.handle('video:setDevice', (_evt, device) => { if (videoProc) videoProc.stdin.write(JSON.stringify({ action: 'set_device', device }) + '\n'); return true })

// Face Recognition Pipeline IPC handlers
ipcMain.handle('face-recognition:initialize', async (_evt, options) => {
    try {
        if (!faceRecognitionPipeline) {
            faceRecognitionPipeline = new FaceRecognitionPipeline()
        }
        return { success: true, message: 'Pipeline initialized successfully' }
    } catch (error) {
        console.error('Failed to initialize face recognition pipeline:', error)
        return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
})

ipcMain.handle('face-recognition:process-frame', async (_evt, imageData) => {
    try {
        if (!faceRecognitionPipeline) {
            throw new Error('Pipeline not initialized')
        }
        
        const startTime = performance.now()
        
        // Convert ImageData to numpy array for processing
        const { data, width, height } = imageData
        const frame = new Uint8Array(data)
        
        // Process frame through pipeline
        const processedFrame = frame // For now, just pass through
        const detections: any[] = [] // Placeholder for actual detection results
        
        const processingTime = performance.now() - startTime
        
        return {
            success: true,
            detections,
            processingTime
        }
    } catch (error) {
        console.error('Frame processing error:', error)
        return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
})

ipcMain.handle('face-recognition:register-person', async (_evt, personId, imageData, landmarks) => {
    try {
        if (!faceRecognitionPipeline) {
            throw new Error('Pipeline not initialized')
        }
        
        // Implementation for person registration
        return true
    } catch (error) {
        console.error('Person registration error:', error)
        return false
    }
})

ipcMain.handle('face-recognition:get-persons', async () => {
    try {
        if (!faceRecognitionPipeline) {
            return []
        }
        return [] // Placeholder for actual person list
    } catch (error) {
        console.error('Get persons error:', error)
        return []
    }
})

ipcMain.handle('face-recognition:remove-person', async (_evt, personId) => {
    try {
        if (!faceRecognitionPipeline) {
            return false
        }
        return true // Placeholder for actual removal
    } catch (error) {
        console.error('Remove person error:', error)
        return false
    }
})

// Window control IPC handlers
ipcMain.handle('window:minimize', () => {
    if (mainWindowRef) mainWindowRef.minimize()
    return true
})

ipcMain.handle('window:maximize', () => {
    if (mainWindowRef) {
        if (mainWindowRef.isMaximized()) {
            mainWindowRef.unmaximize()
        } else {
            mainWindowRef.maximize()
        }
    }
    return true
})

ipcMain.handle('window:close', () => {
    if (mainWindowRef) mainWindowRef.close()
    return true
})

function createWindow(): void {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 1600,
        height: 1000,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        titleBarStyle: 'hidden',
        frame: false,
        show: false,
        backgroundColor: '#000000'
    })

    mainWindowRef = mainWindow

    // Load the app
    if (isDev()) {
        mainWindow.loadURL('http://localhost:5173')
        mainWindow.webContents.openDevTools()
    } else {
        mainWindow.loadFile(path.join(__dirname, '../index.html'))
    }

    // Show window when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow.show()
    })

    // Handle window maximize/restore events
    mainWindow.on('maximize', () => {
        mainWindow.webContents.send('window:maximized')
    })

    mainWindow.on('unmaximize', () => {
        mainWindow.webContents.send('window:unmaximized')
    })

    // Handle window close
    mainWindow.on('closed', () => {
        mainWindowRef = null
        stopBackend()
        stopVideo()
    })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    createWindow()

    app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

// Start backend on app ready
app.whenReady().then(() => {
    // Start backend after a short delay to ensure app is ready
    setTimeout(() => {
        startBackend()
    }, 1000)
})

// Handle app quit
app.on('before-quit', () => {
    stopBackend()
    stopVideo()
})