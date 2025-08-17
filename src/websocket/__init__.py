"""
Suri WebSocket Package

Production-ready WebSocket implementation for the Suri Face Recognition System.

This package provides:
- ConnectionManager: Manages WebSocket connections and broadcasting
- WebSocket routes: Handles message routing and protocol validation
- Error handling: Structured error responses and logging
- Integration: Seamless integration with prototype backend logic

Usage:
    from src.websocket import connection_manager, websocket_endpoint
    from src.websocket.routes import set_attendance_system
"""

from .manager import connection_manager, create_success_response, create_error_response
from .routes import websocket_endpoint, set_attendance_system

__all__ = [
    "connection_manager",
    "websocket_endpoint", 
    "set_attendance_system",
    "create_success_response",
    "create_error_response"
]
