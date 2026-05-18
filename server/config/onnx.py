OPTIMIZED_PROVIDERS = ["CPUExecutionProvider"]

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
except (ImportError, AttributeError):
    OPTIMIZED_SESSION_OPTIONS = {
        "enable_cpu_mem_arena": True,
        "enable_memory_pattern": True,
        "enable_profiling": False,
        "inter_op_num_threads": 0,
        "intra_op_num_threads": 0,
        "log_severity_level": 3,
    }
