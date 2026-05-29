"""
Utility functions package

Contains image processing utilities, WebSocket management, and face serialization.
"""

from .websocket_manager import manager, ConnectionManager
from .face_utils import serialize_faces

__all__ = [
    "manager",
    "ConnectionManager",
    "serialize_faces",
]
