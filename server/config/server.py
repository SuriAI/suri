import os
from typing import Dict, Any

SERVER_CONFIG = {
    "host": "127.0.0.1",
    "port": 8700,
    "reload": False,
    "log_level": "info",
    "workers": 1,
}


def get_server_config() -> Dict[str, Any]:
    config = SERVER_CONFIG.copy()
    env = os.getenv("ENVIRONMENT", "development")

    if env == "production":
        config["reload"] = False
        config["workers"] = 4
    elif env == "testing":
        config["port"] = 8700

    if os.getenv("SERVER_HOST"):
        config["host"] = os.getenv("SERVER_HOST")
    if os.getenv("SERVER_PORT"):
        config["port"] = int(os.getenv("SERVER_PORT"))

    return config
