#!/usr/bin/env python3
"""
Test script to demonstrate real-time WebSocket functionality for Suri Face Recognition System.

This script tests the following real-time features:
1. Real-time attendance logging notifications
2. Real-time person addition notifications  
3. Real-time database update notifications
4. Today's activity updates

Usage:
    python test_websocket_realtime.py
"""

import asyncio
import websockets
import json
import logging
from datetime import datetime
import uuid

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SuriWebSocketTester:
    def __init__(self, websocket_url="ws://localhost:8770/ws"):
        self.websocket_url = websocket_url
        self.websocket = None
        self.running = False
        
    async def connect(self):
        """Connect to the WebSocket server."""
        try:
            self.websocket = await websockets.connect(self.websocket_url)
            self.running = True
            logger.info(f"Connected to WebSocket server at {self.websocket_url}")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to WebSocket: {e}")
            return False
    
    async def disconnect(self):
        """Disconnect from the WebSocket server."""
        self.running = False
        if self.websocket:
            await self.websocket.close()
            logger.info("Disconnected from WebSocket server")
    
    async def send_message(self, action, payload=None):
        """Send a message to the WebSocket server."""
        if not self.websocket:
            logger.error("Not connected to WebSocket server")
            return None
        
        message = {
            "id": str(uuid.uuid4()),
            "action": action,
            "payload": payload or {}
        }
        
        try:
            await self.websocket.send(json.dumps(message))
            logger.info(f"Sent message: {action}")
            return message["id"]
        except Exception as e:
            logger.error(f"Failed to send message: {e}")
            return None
    
    async def listen_for_messages(self):
        """Listen for messages from the WebSocket server."""
        while self.running and self.websocket:
            try:
                message_text = await self.websocket.recv()
                message = json.loads(message_text)
                
                # Check if this is a response or a broadcast event
                if "action" in message and "status" in message:
                    # This is a response to our request
                    self.handle_response(message)
                else:
                    # This is a broadcast event
                    self.handle_broadcast_event(message)
                    
            except websockets.exceptions.ConnectionClosed:
                logger.info("WebSocket connection closed")
                break
            except Exception as e:
                logger.error(f"Error receiving message: {e}")
                break
    
    def handle_response(self, message):
        """Handle response messages from the server."""
        action = message.get("action", "unknown")
        status = message.get("status", "unknown")
        
        if status == "success":
            logger.info(f"✅ {action} succeeded")
            
            # Handle specific responses
            if action == "get_today_attendance":
                payload = message.get("payload", {})
                records = payload.get("records", [])
                logger.info(f"📋 Today's attendance: {len(records)} records")
                for record in records[-3:]:  # Show last 3 records
                    logger.info(f"   - {record.get('name', 'Unknown')} at {record.get('time', 'Unknown')}")
            
            elif action == "subscribe_attendance_updates":
                payload = message.get("payload", {})
                events = payload.get("events", [])
                logger.info(f"🔔 Subscribed to events: {', '.join(events)}")
                
        else:
            logger.error(f"❌ {action} failed: {message.get('payload', {}).get('message', 'Unknown error')}")
    
    def handle_broadcast_event(self, event):
        """Handle broadcast events from the server."""
        event_type = event.get("type", "unknown")
        
        if event_type == "attendance_logged":
            data = event.get("data", {})
            person_name = data.get("person_name", "Unknown")
            confidence = data.get("confidence", 0)
            record = data.get("record", {})
            
            logger.info(f"🎯 NEW ATTENDANCE: {person_name} (confidence: {confidence:.3f})")
            logger.info(f"   📅 Date: {record.get('date', 'Unknown')}")
            logger.info(f"   ⏰ Time: {record.get('time', 'Unknown')}")
            
        elif event_type == "person_added":
            data = event.get("data", {})
            name = data.get("name", "Unknown")
            method = data.get("method", "unknown")
            templates_count = data.get("templates_count", 1)
            
            logger.info(f"👤 NEW PERSON ADDED: {name}")
            logger.info(f"   📝 Method: {method}")
            if templates_count > 1:
                logger.info(f"   🎭 Templates: {templates_count}")
                
        elif event_type == "database_updated":
            data = event.get("data", {})
            stats = data.get("stats", {})
            
            old_face_count = stats.get("old_face_count", 0)
            new_face_count = stats.get("new_face_count", 0)
            people_count = stats.get("people_count", 0)
            
            if new_face_count > old_face_count:
                logger.info(f"📚 DATABASE UPDATED: +{new_face_count - old_face_count} faces")
                logger.info(f"   👥 Total people: {people_count}")
        else:
            logger.info(f"📡 Received event: {event_type}")
    
    async def test_basic_functionality(self):
        """Test basic WebSocket functionality."""
        logger.info("🧪 Testing basic WebSocket functionality...")
        
        # Test ping
        await self.send_message("ping")
        await asyncio.sleep(0.5)
        
        # Test get version
        await self.send_message("get_version")
        await asyncio.sleep(0.5)
        
        # Test get system status
        await self.send_message("get_system_status")
        await asyncio.sleep(0.5)
        
        logger.info("✅ Basic functionality tests completed")
    
    async def test_attendance_features(self):
        """Test attendance-related WebSocket features.""" 
        logger.info("🎯 Testing attendance WebSocket features...")
        
        # Subscribe to attendance updates
        await self.send_message("subscribe_attendance_updates")
        await asyncio.sleep(0.5)
        
        # Get today's attendance
        await self.send_message("get_today_attendance") 
        await asyncio.sleep(0.5)
        
        logger.info("✅ Attendance feature tests completed")
        logger.info("🔔 Now listening for real-time events...")
        logger.info("   - Add a person via the API to see person_added events")
        logger.info("   - Recognize a face via camera to see attendance_logged events")
        logger.info("   - Database changes will trigger database_updated events")
    
    async def run_demo(self, duration=60):
        """Run the complete WebSocket demonstration."""
        logger.info("🚀 Starting Suri WebSocket Real-time Demo")
        logger.info("=" * 60)
        
        # Connect to WebSocket
        if not await self.connect():
            return
        
        try:
            # Start listening for messages in background
            listen_task = asyncio.create_task(self.listen_for_messages())
            
            # Run tests
            await self.test_basic_functionality()
            await asyncio.sleep(1)
            
            await self.test_attendance_features()
            await asyncio.sleep(2)
            
            # Listen for real-time events
            logger.info(f"⏱️ Listening for real-time events for {duration} seconds...")
            logger.info("   💡 Tip: Try adding a person via the API while this is running!")
            
            await asyncio.sleep(duration)
            
            # Cancel listening task
            listen_task.cancel()
            
        except KeyboardInterrupt:
            logger.info("Demo interrupted by user")
        except Exception as e:
            logger.error(f"Demo error: {e}")
        finally:
            await self.disconnect()
        
        logger.info("🏁 Demo completed")


async def main():
    """Main function to run the WebSocket tester."""
    print("""
🎯 Suri Face Recognition - WebSocket Real-time Demo
==================================================

This demo will:
1. Connect to the Suri WebSocket server
2. Test basic WebSocket functionality
3. Subscribe to real-time attendance updates
4. Listen for real-time events

Make sure the Suri API server is running on localhost:8770

Press Ctrl+C to stop the demo early.
""")
    
    tester = SuriWebSocketTester()
    
    try:
        await tester.run_demo(duration=120)  # Run for 2 minutes
    except KeyboardInterrupt:
        logger.info("Demo stopped by user")
    except Exception as e:
        logger.error(f"Demo failed: {e}")


if __name__ == "__main__":
    asyncio.run(main())
