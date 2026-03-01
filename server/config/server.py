import os
from typing import Dict, Any

SERVER_CONFIG = {
    "host": "127.0.0.1",
    "port": 8700,
    "reload": False,
    "log_level": "info",
    # Workers must stay at 1 when passing a live `app` object to uvicorn.run().
    # Multi-worker mode only works with an import string (e.g. "main:app").
    # For a local desktop process, 1 worker is also sufficient.
    "workers": 1,
}


def get_server_config() -> Dict[str, Any]:
    config = SERVER_CONFIG.copy()
    env = os.getenv("ENVIRONMENT", "development")

    if env == "testing":
        config["port"] = 8700

    if os.getenv("SERVER_HOST"):
        config["host"] = os.getenv("SERVER_HOST")
    if os.getenv("SERVER_PORT"):
        config["port"] = int(os.getenv("SERVER_PORT"))

    return config
