"""
WebSocket Connection Manager for Suri Face Recognition System

Provides production-ready WebSocket connection management with:
- Connection tracking per client
- Broadcast messaging capability
- Graceful disconnect handling
- JSON message protocol
"""

import json
import logging
from typing import Dict, Set, Any, Optional
from fastapi import WebSocket, WebSocketDisconnect

# Set up logging
logger = logging.getLogger("suri.websocket")


class ConnectionManager:
    """
    Manages WebSocket connections for the Suri application.
    
    Features:
    - Track active connections per client
    - Send messages to specific clients or broadcast to all
    - Handle disconnections gracefully
    - JSON message protocol with structured responses
    """
    
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.connection_info: Dict[WebSocket, Dict[str, Any]] = {}
    
    async def connect(self, websocket: WebSocket, client_info: Optional[Dict[str, Any]] = None):
        """
        Accept a new WebSocket connection and track it.
        
        Args:
            websocket: The WebSocket connection to accept
            client_info: Optional client information for tracking
        """
        await websocket.accept()
        self.active_connections.add(websocket)
        
        # Store client info if provided
        if client_info:
            self.connection_info[websocket] = client_info
        else:
            self.connection_info[websocket] = {"connected_at": "unknown"}
        
        logger.info(f"New WebSocket connection established. Total connections: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket):
        """
        Remove a WebSocket connection from tracking.
        
        Args:
            websocket: The WebSocket connection to remove
        """
        self.active_connections.discard(websocket)
        self.connection_info.pop(websocket, None)
        logger.info(f"WebSocket connection closed. Total connections: {len(self.active_connections)}")
    
    async def send_personal_message(self, message: Dict[str, Any], websocket: WebSocket):
        """
        Send a message to a specific WebSocket connection.
        
        Args:
            message: The message dictionary to send
            websocket: The target WebSocket connection
        """
        try:
            await websocket.send_text(json.dumps(message))
        except Exception as e:
            logger.error(f"Failed to send personal message: {e}")
            # Remove the connection if sending fails
            self.disconnect(websocket)
    
    async def broadcast(self, message: Dict[str, Any]):
        """
        Broadcast a message to all active WebSocket connections.
        
        Args:
            message: The message dictionary to broadcast
        """
        if not self.active_connections:
            logger.debug("No active connections to broadcast to")
            return
        
        disconnected_connections = []
        message_text = json.dumps(message)
        
        for connection in list(self.active_connections):
            try:
                await connection.send_text(message_text)
            except Exception as e:
                logger.error(f"Failed to broadcast to connection: {e}")
                disconnected_connections.append(connection)
        
        # Clean up failed connections
        for connection in disconnected_connections:
            self.disconnect(connection)
        
        logger.debug(f"Broadcasted message to {len(self.active_connections)} connections")
    
    def get_connection_count(self) -> int:
        """Get the number of active connections."""
        return len(self.active_connections)
    
    def get_connection_info(self) -> Dict[str, Any]:
        """Get information about all active connections."""
        return {
            "total_connections": len(self.active_connections),
            "connections": [info for info in self.connection_info.values()]
        }


# Global connection manager instance
connection_manager = ConnectionManager()


def create_success_response(request_id: str, action: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create a standardized success response.
    
    Args:
        request_id: The ID from the original request
        action: The action that was performed
        payload: The response data
    
    Returns:
        Structured success response dictionary
    """
    return {
        "id": request_id,
        "action": action,
        "status": "success",
        "payload": payload
    }


def create_error_response(request_id: str, action: str, error_message: str, error_code: Optional[str] = None) -> Dict[str, Any]:
    """
    Create a standardized error response.
    
    Args:
        request_id: The ID from the original request
        action: The action that failed
        error_message: Human-readable error message
        error_code: Optional error code for programmatic handling
    
    Returns:
        Structured error response dictionary
    """
    return {
        "id": request_id,
        "action": action,
        "status": "error",
        "payload": {
            "message": error_message,
            "code": error_code or "UNKNOWN_ERROR"
        }
    }
