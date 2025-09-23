# Suri - PyInstaller + Electron Integration Guide

This guide provides complete instructions for bundling your Python FastAPI backend into an Electron application using PyInstaller, ensuring no Python installation is required for end-users.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Project Structure](#project-structure)
4. [Step-by-Step Setup](#step-by-step-setup)
5. [Development Workflow](#development-workflow)
6. [Production Build](#production-build)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)
9. [Cross-Platform Considerations](#cross-platform-considerations)

## 🎯 Overview

This integration allows you to:
- ✅ Bundle Python backend as standalone executable
- ✅ No Python installation required for end-users
- ✅ Full offline functionality
- ✅ Single installer for complete application
- ✅ Cross-platform support (Windows, macOS, Linux)

### Architecture

```
Electron App
├── Frontend (React/TypeScript)
├── Main Process (Node.js)
│   └── BackendService (manages Python executable)
└── Resources
    ├── Backend Executable (PyInstaller)
    ├── Model Weights
    └── Configuration Files
```

## 🔧 Prerequisites

### Development Environment
- **Python 3.8+** with pip
- **Node.js 16+** with pnpm
- **Git** for version control

### Platform-Specific Requirements

#### Windows
- **Visual Studio Build Tools** (for native dependencies)
- **Windows SDK** (for Electron packaging)

#### macOS
- **Xcode Command Line Tools**
- **macOS Developer Account** (for code signing)

#### Linux
- **build-essential** package
- **libnss3-dev** and other Electron dependencies

## 📁 Project Structure

```
suri/
├── backend/                    # Python FastAPI backend
│   ├── main.py                # FastAPI application
│   ├── run.py                 # Entry point script
│   ├── config.py              # Configuration
│   ├── requirements.txt       # Python dependencies
│   ├── suri_backend.spec      # PyInstaller specification
│   ├── build_backend.py       # Build automation script
│   ├── build_windows.bat      # Windows build script
│   ├── build_unix.sh          # Unix build script
│   ├── hook-onnxruntime.py    # PyInstaller hook
│   └── dist/                  # Generated executables
│       ├── suri-backend.exe   # Windows executable
│       └── suri-backend       # Unix executable
├── desktop/                   # Electron application
│   ├── src/
│   │   ├── electron/
│   │   │   ├── main.ts        # Main Electron process
│   │   │   └── backendService.ts  # Backend management
│   │   └── renderer/          # React frontend
│   ├── scripts/
│   │   └── before-pack.js     # Pre-packaging script
│   ├── package.json
│   ├── electron-builder.json  # Packaging configuration
│   └── dist/                  # Packaged applications
├── build-all.bat             # Complete build (Windows)
├── build-all.sh              # Complete build (Unix)
├── dev-start.bat             # Development mode (Windows)
├── dev-start.sh              # Development mode (Unix)
├── OPTIMIZATION_GUIDE.md     # Size optimization tips
└── README.md
```

## 🚀 Step-by-Step Setup

### Step 1: Backend PyInstaller Configuration

The PyInstaller configuration is already set up in `backend/suri_backend.spec`:

```python
# Key features:
- One-file executable for easy distribution
- Includes model weights and configuration
- Excludes unnecessary modules to reduce size
- Handles hidden imports for FastAPI/Uvicorn
- Optional UPX compression
```

### Step 2: Electron Backend Service

The `backendService.ts` handles:
- **Development Mode**: Runs Python script directly
- **Production Mode**: Launches PyInstaller executable
- **Process Management**: Start, stop, restart, health checks
- **Error Handling**: Graceful failure and recovery

```typescript
// Automatic mode detection
private getBackendPath(): string {
    if (app.isPackaged) {
        // Production: Use bundled executable
        const platform = process.platform;
        const execName = platform === 'win32' ? 'suri-backend.exe' : 'suri-backend';
        return path.join(process.resourcesPath, 'backend', execName);
    } else {
        // Development: Use Python script
        return path.join(__dirname, '..', '..', '..', 'backend', 'run.py');
    }
}
```

### Step 3: Build Configuration

The `electron-builder.json` includes platform-specific backend executables:

```json
{
    "win": {
        "extraResources": [
            {
                "from": "../backend/dist/suri-backend.exe",
                "to": "backend/suri-backend.exe"
            }
        ]
    }
}
```

## 🔄 Development Workflow

### Quick Start

1. **Start Development Servers**:
   ```bash
   # Windows
   ./dev-start.bat
   
   # macOS/Linux
   ./dev-start.sh
   ```

2. **Manual Development**:
   ```bash
   # Terminal 1: Start backend
   cd backend
   python run.py
   
   # Terminal 2: Start frontend
   cd desktop
   pnpm dev
   ```

### Development vs Production

| Mode | Backend | Frontend | Use Case |
|------|---------|----------|----------|
| Development | Python script | Vite dev server | Active development |
| Production | PyInstaller exe | Built React app | End-user distribution |

## 🏗️ Production Build

### Complete Build Process

1. **Automated Build**:
   ```bash
   # Windows
   ./build-all.bat
   
   # macOS/Linux
   ./build-all.sh
   ```

2. **Manual Build Steps**:
   ```bash
   # 1. Build backend
   cd backend
   python build_backend.py
   
   # 2. Build frontend
   cd ../desktop
   pnpm install
   pnpm build
   
   # 3. Package application
   pnpm dist:win    # Windows
   pnpm dist:mac    # macOS
   pnpm dist:linux  # Linux
   ```

### Build Outputs

- **Backend**: `backend/dist/suri-backend[.exe]`
- **Electron App**: `desktop/dist/Suri-Setup-*.exe` (or platform equivalent)

## 🎯 Best Practices

### 1. Path Management

```typescript
// ✅ Good: Use path.join for cross-platform compatibility
const backendPath = path.join(process.resourcesPath, 'backend', 'suri-backend');

// ❌ Bad: Hardcoded paths
const backendPath = process.resourcesPath + '/backend/suri-backend';
```

### 2. Process Lifecycle

```typescript
// ✅ Good: Proper cleanup
app.on('before-quit', async () => {
    await backendService.stop();
});

// ✅ Good: Health checks
setInterval(async () => {
    const isHealthy = await backendService.checkHealth();
    if (!isHealthy) {
        await backendService.restart();
    }
}, 30000);
```

### 3. Error Handling

```typescript
// ✅ Good: Graceful error handling
try {
    await backendService.start();
} catch (error) {
    console.error('Failed to start backend:', error);
    // Show user-friendly error dialog
    dialog.showErrorBox('Backend Error', 'Failed to start the backend service.');
}
```

### 4. Security Considerations

```typescript
// ✅ Good: Validate backend responses
const response = await fetch(`${this.baseUrl}/detect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
});

if (!response.ok) {
    throw new Error(`Backend error: ${response.status}`);
}
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Backend Executable Not Found

**Symptoms**: "Backend executable not found" error

**Solutions**:
- Ensure backend is built before packaging: `python build_backend.py`
- Check `electron-builder.json` paths are correct
- Verify `before-pack.js` script runs successfully

#### 2. Python Dependencies Missing

**Symptoms**: Import errors in PyInstaller executable

**Solutions**:
- Add missing modules to `hiddenimports` in `suri_backend.spec`
- Create custom hooks for complex dependencies
- Use `--collect-all` flag for problematic packages

#### 3. Model Files Not Found

**Symptoms**: "Model file not found" errors

**Solutions**:
- Verify model paths in `config.py`
- Ensure models are included in PyInstaller `datas`
- Check file permissions on model files

#### 4. Port Conflicts

**Symptoms**: "Address already in use" errors

**Solutions**:
- Use dynamic port allocation
- Implement port conflict detection
- Add retry logic with different ports

### Debug Mode

Enable debug logging:

```python
# In build_backend.py
python build_backend.py --debug

# In backendService.ts
private debug = process.env.NODE_ENV === 'development';
```

## 🌍 Cross-Platform Considerations

### Windows
- **File Extensions**: `.exe` for executables
- **Path Separators**: Use `path.join()` instead of `/`
- **Permissions**: Usually no special requirements
- **Code Signing**: Optional but recommended for distribution

### macOS
- **Executable Permissions**: Ensure executable bit is set
- **Gatekeeper**: Code signing required for distribution
- **Notarization**: Required for macOS 10.15+
- **App Bundle**: Follow macOS app structure conventions

### Linux
- **Executable Permissions**: `chmod +x` required
- **Dependencies**: May need additional system libraries
- **AppImage**: Recommended distribution format
- **Desktop Integration**: `.desktop` files for menu integration

### Build Matrix

| Platform | Build On | Output Format | Notes |
|----------|----------|---------------|-------|
| Windows | Windows | `.exe`, `.msi` | Native build recommended |
| macOS | macOS | `.dmg`, `.pkg` | Requires macOS for code signing |
| Linux | Linux | `.AppImage`, `.deb` | Can cross-compile from other platforms |

## 📊 Performance Metrics

### Typical Bundle Sizes

| Component | Size | Optimization Potential |
|-----------|------|----------------------|
| Electron Runtime | ~150MB | Minimal |
| Python Runtime | ~100MB | 30-50% with optimization |
| Dependencies | ~80MB | 40-60% with cleanup |
| Models | ~50MB | 50-70% with quantization |
| **Total** | **~380MB** | **~150MB optimized** |

### Startup Times

- **Cold Start**: 3-5 seconds
- **Warm Start**: 1-2 seconds
- **Backend Ready**: 2-3 seconds after start

## 🔄 Maintenance

### Regular Tasks

1. **Dependency Updates**:
   ```bash
   # Update Python dependencies
   pip-review --auto
   
   # Update Node.js dependencies
   pnpm update
   ```

2. **Security Audits**:
   ```bash
   # Python security check
   pip-audit
   
   # Node.js security check
   pnpm audit
   ```

3. **Bundle Size Monitoring**:
   ```bash
   # Analyze bundle size
   du -sh desktop/dist/*
   du -sh backend/dist/*
   ```

### Version Management

- **Semantic Versioning**: Use semver for releases
- **Changelog**: Maintain detailed changelog
- **Release Notes**: Document breaking changes

## 📚 Additional Resources

- [PyInstaller Documentation](https://pyinstaller.readthedocs.io/)
- [Electron Builder Documentation](https://www.electron.build/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Optimization Guide](./OPTIMIZATION_GUIDE.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on all target platforms
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.