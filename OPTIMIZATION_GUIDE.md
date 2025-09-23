# Suri - Optimization Guide

This guide provides tips and strategies for optimizing your PyInstaller + Electron application to reduce installer size and improve performance.

## 🎯 Current Optimizations Implemented

### PyInstaller Optimizations

1. **Excluded Unnecessary Modules**
   ```python
   excludes=[
       'tkinter', 'matplotlib', 'scipy', 'pandas',
       'jupyter', 'IPython', 'notebook',
       'pytest', 'unittest', 'doctest',
       'pdb', 'cProfile', 'profile',
       'xml.etree.ElementTree', 'xml.dom',
       'email', 'urllib3.packages.six.moves'
   ]
   ```

2. **Hidden Imports for Required Modules**
   - Only includes essential FastAPI, Uvicorn, and CV dependencies
   - Explicit ONNX Runtime CPU provider inclusion

3. **Binary Exclusions**
   ```python
   binaries=[
       ('weights/*', 'weights'),  # Only include model weights
   ]
   ```

4. **UPX Compression** (Optional)
   - Enabled in the spec file for additional size reduction
   - Can reduce executable size by 30-50%

## 📊 Size Reduction Strategies

### 1. Model Optimization

**Current Impact**: Model weights are ~50-100MB of your total size

**Optimizations**:
- **Quantization**: Convert models to INT8 format
  ```python
  # Example for ONNX model quantization
  from onnxruntime.quantization import quantize_dynamic, QuantType
  
  quantize_dynamic(
      model_input="model.onnx",
      model_output="model_quantized.onnx",
      weight_type=QuantType.QUInt8
  )
  ```

- **Model Pruning**: Remove unnecessary model layers
- **Use Smaller Models**: Consider MobileNet variants for face detection

### 2. Python Dependencies

**Current Impact**: Python runtime + dependencies ~100-200MB

**Optimizations**:
- **Minimal OpenCV**: Use `opencv-python-headless` instead of `opencv-python`
  ```bash
  pip uninstall opencv-python
  pip install opencv-python-headless
  ```

- **ONNX Runtime Optimization**:
  ```python
  # In your PyInstaller spec, exclude GPU providers
  excludes.extend([
      'onnxruntime.capi.onnxruntime_providers_cuda',
      'onnxruntime.capi.onnxruntime_providers_tensorrt',
      'onnxruntime.capi.onnxruntime_providers_rocm'
  ])
  ```

### 3. Electron Bundle Optimization

**Current Impact**: Electron runtime ~150-200MB

**Optimizations**:
- **Tree Shaking**: Ensure unused code is eliminated
- **Code Splitting**: Split large components
- **Asset Optimization**: Compress images and fonts

## 🔧 Advanced Optimization Techniques

### 1. Multi-Stage PyInstaller Build

Create a two-stage build process:

```python
# Stage 1: Create minimal runtime
# Stage 2: Add only required components
```

### 2. Dynamic Model Loading

Instead of bundling all models, load them on-demand:

```python
# config.py modification
MODEL_DOWNLOAD_URL = "https://your-cdn.com/models/"
LOCAL_MODEL_CACHE = os.path.join(os.path.expanduser("~"), ".suri", "models")

def download_model_if_needed(model_name):
    local_path = os.path.join(LOCAL_MODEL_CACHE, model_name)
    if not os.path.exists(local_path):
        # Download from CDN
        download_model(model_name, local_path)
    return local_path
```

### 3. Lazy Loading

Implement lazy loading for heavy dependencies:

```python
# Instead of importing at module level
import cv2
import onnxruntime

# Use lazy imports
def get_cv2():
    global _cv2
    if '_cv2' not in globals():
        import cv2 as _cv2
    return _cv2

def get_onnx_session():
    global _onnx_session
    if '_onnx_session' not in globals():
        import onnxruntime
        _onnx_session = onnxruntime.InferenceSession(model_path)
    return _onnx_session
```

## 📈 Size Comparison

| Component | Before Optimization | After Optimization | Savings |
|-----------|-------------------|-------------------|---------|
| Python Runtime | ~150MB | ~100MB | 33% |
| OpenCV | ~80MB | ~40MB | 50% |
| ONNX Runtime | ~50MB | ~30MB | 40% |
| Models | ~100MB | ~50MB* | 50% |
| **Total** | **~380MB** | **~220MB** | **42%** |

*With quantization and pruning

## 🚀 Performance Optimizations

### 1. Startup Time

- **Precompile Python**: Use `py_compile` for faster imports
- **Reduce Import Time**: Use lazy imports for non-critical modules
- **Cache Model Loading**: Keep models in memory between requests

### 2. Runtime Performance

- **Connection Pooling**: Reuse HTTP connections
- **Memory Management**: Implement proper cleanup for CV operations
- **Threading**: Use async/await for I/O operations

### 3. Backend Service Optimization

```typescript
// In backendService.ts
class BackendService {
    private healthCheckInterval = 30000; // 30 seconds
    private maxRetries = 3;
    private connectionPool = new Map();
    
    // Implement connection pooling
    private async getConnection(endpoint: string) {
        if (!this.connectionPool.has(endpoint)) {
            // Create new connection
        }
        return this.connectionPool.get(endpoint);
    }
}
```

## 🔍 Monitoring and Profiling

### 1. Size Analysis

```bash
# Analyze PyInstaller bundle
python -m PyInstaller --log-level=DEBUG suri_backend.spec

# Check what's taking space
du -sh dist/suri-backend/*
```

### 2. Performance Profiling

```python
# Add to your backend
import cProfile
import pstats

def profile_endpoint(func):
    def wrapper(*args, **kwargs):
        pr = cProfile.Profile()
        pr.enable()
        result = func(*args, **kwargs)
        pr.disable()
        
        stats = pstats.Stats(pr)
        stats.sort_stats('cumulative')
        stats.print_stats(10)  # Top 10 functions
        
        return result
    return wrapper
```

## 📋 Optimization Checklist

- [ ] Replace `opencv-python` with `opencv-python-headless`
- [ ] Quantize ONNX models to INT8
- [ ] Remove unused PyInstaller excludes
- [ ] Enable UPX compression
- [ ] Implement lazy loading for heavy modules
- [ ] Use dynamic model loading for optional models
- [ ] Optimize Electron bundle with tree shaking
- [ ] Compress static assets (images, fonts)
- [ ] Profile and optimize hot code paths
- [ ] Monitor bundle size in CI/CD pipeline

## 🎯 Target Sizes

| Build Type | Target Size | Notes |
|------------|-------------|-------|
| Development | No limit | Focus on development speed |
| Production | < 200MB | Good balance of features/size |
| Minimal | < 100MB | Core features only |
| Enterprise | < 500MB | All features, multiple models |

## 🔄 Continuous Optimization

1. **Bundle Size Monitoring**: Track size changes in CI/CD
2. **Performance Benchmarks**: Automated performance testing
3. **User Feedback**: Monitor real-world performance metrics
4. **Regular Audits**: Quarterly dependency and bundle analysis

Remember: Optimization is an iterative process. Start with the biggest wins (model quantization, dependency cleanup) and gradually work on smaller optimizations.