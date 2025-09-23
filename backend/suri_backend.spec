# -*- mode: python ; coding: utf-8 -*-
"""
PyInstaller spec file for Suri Face Detection Backend
Optimized for computer vision dependencies and model files
"""

import os
import sys
from pathlib import Path

# Get the backend directory
backend_dir = Path(os.getcwd())
project_root = backend_dir.parent
weights_dir = project_root / "desktop" / "public" / "weights"

# Define data files to include
datas = []

# Include model weights if they exist
if weights_dir.exists():
    for model_file in weights_dir.glob("*.onnx"):
        datas.append((str(model_file), "weights"))

# Include any additional data files
data_dir = backend_dir / "data"
if data_dir.exists():
    for data_file in data_dir.glob("*"):
        if data_file.is_file():
            datas.append((str(data_file), "data"))

# Hidden imports for dependencies that PyInstaller might miss
hiddenimports = [
    # FastAPI and Uvicorn
    'uvicorn.lifespan.on',
    'uvicorn.lifespan.off',
    'uvicorn.protocols.websockets.auto',
    'uvicorn.protocols.http.auto',
    'uvicorn.protocols.websockets.websockets_impl',
    'uvicorn.protocols.http.httptools_impl',
    'uvicorn.protocols.http.h11_impl',
    'uvicorn.loops.auto',
    'uvicorn.loops.asyncio',
    'uvicorn.logging',
    
    # FastAPI dependencies
    'fastapi.routing',
    'fastapi.encoders',
    'fastapi.exceptions',
    'fastapi.utils',
    'starlette.routing',
    'starlette.middleware',
    'starlette.middleware.cors',
    'starlette.responses',
    'starlette.exceptions',
    
    # Pydantic
    'pydantic.json',
    'pydantic.types',
    'pydantic.validators',
    'pydantic.networks',
    'pydantic.datetime_parse',
    
    # Computer Vision
    'cv2',
    'numpy',
    'PIL',
    'PIL._tkinter_finder',
    
    # ONNX Runtime
    'onnxruntime',
    'onnxruntime.capi',
    'onnxruntime.capi.onnxruntime_pybind11_state',
    'onnxruntime.providers',
    
    # WebSocket
    'websockets',
    'websockets.legacy',
    'websockets.legacy.server',
    'websockets.legacy.client',
    
    # Async
    'asyncio',
    'concurrent.futures',
    
    # JSON and serialization
    'json',
    'base64',
    'uuid',
    'pickle',
    
    # Multiprocessing (required by PyInstaller runtime)
    'multiprocessing',
    'multiprocessing.context',
    'multiprocessing.reduction',
    'multiprocessing.spawn',
    'multiprocessing.util',
    
    # Logging
    'logging.config',
    'structlog',
    
    # Your custom modules
    'models.yunet_detector',
    'models.antispoofing_detector',
    'models.edgeface_detector',
    'utils.image_utils',
    'utils.websocket_manager',
    'utils.database_manager',
    'config',
]

# Binaries to exclude (reduce size) - only exclude truly unnecessary modules
excludes = [
    'tkinter',
    'matplotlib',
    'scipy',
    'pandas',
    'jupyter',
    'notebook',
    'IPython',
    'pytest',
    'setuptools',
    'distutils',
    'pydoc',
    'doctest',
    'cmd',
    'bdb',
    'pdb',
    'cProfile',
    'profile',
    'timeit',
    'trace',
    'test',
    'unittest',
    'lib2to3',
]

block_cipher = None

a = Analysis(
    ['run.py'],  # Entry point
    pathex=[str(backend_dir)],
    binaries=[],
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=excludes,
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

# Remove duplicate entries
pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='suri-backend',
    debug=False,  # Set to True for debugging
    bootloader_ignore_signals=False,
    strip=False,  # Keep symbols for better error reporting
    upx=True,  # Compress executable (optional, may cause issues with some antivirus)
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,  # Keep console for logging
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=None,  # Add icon path if you have one
)