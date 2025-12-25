try:
    import onnxruntime as ort

    available = ort.get_available_providers()
    providers = []
    gpu_name = "CPU Only"

    if "CUDAExecutionProvider" in available:
        providers.append(
            (
                "CUDAExecutionProvider",
                {
                    "device_id": 0,
                    "arena_extend_strategy": "kNextPowerOfTwo",
                    "gpu_mem_limit": 2 * 1024 * 1024 * 1024,
                },
            )
        )
        gpu_name = "NVIDIA GPU (CUDA)"
        if "TensorrtExecutionProvider" in available:
            providers.append(("TensorrtExecutionProvider", {"device_id": 0}))
            gpu_name = "NVIDIA GPU (CUDA + TensorRT)"
    elif "DmlExecutionProvider" in available:
        providers.append(("DmlExecutionProvider", {"device_id": 0}))
        gpu_name = "Intel/AMD iGPU (DirectML)"

    providers.append(
        (
            "CPUExecutionProvider",
            {
                "arena_extend_strategy": "kSameAsRequested",
                "enable_cpu_mem_arena": True,
                "enable_memory_pattern": True,
            },
        )
    )

    OPTIMIZED_PROVIDERS = providers
    print(f"GPU Auto-Detection: {gpu_name}")

except Exception as e:
    print(f"GPU detection error: {e}")
    OPTIMIZED_PROVIDERS = [
        ("CUDAExecutionProvider", {"device_id": 0}),
        ("DmlExecutionProvider", {"device_id": 0}),
        (
            "CPUExecutionProvider",
            {
                "arena_extend_strategy": "kSameAsRequested",
                "enable_cpu_mem_arena": True,
                "enable_memory_pattern": True,
            },
        ),
    ]

try:
    import onnxruntime as ort

    OPTIMIZED_SESSION_OPTIONS = {
        "enable_cpu_mem_arena": True,
        "enable_memory_pattern": True,
        "enable_profiling": False,
        "execution_mode": ort.ExecutionMode.ORT_SEQUENTIAL,
        "graph_optimization_level": ort.GraphOptimizationLevel.ORT_ENABLE_ALL,
        "inter_op_num_threads": 0,
        "intra_op_num_threads": 0,
        "log_severity_level": 3,
    }
except ImportError:
    OPTIMIZED_SESSION_OPTIONS = {
        "enable_cpu_mem_arena": True,
        "enable_memory_pattern": True,
        "enable_profiling": False,
        "inter_op_num_threads": 0,
        "intra_op_num_threads": 0,
        "log_severity_level": 3,
    }
