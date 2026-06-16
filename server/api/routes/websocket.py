import json
import logging
import re
import time
import hmac

import cv2
import numpy as np
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from api.deps import normalize_organization_id
from config.models import FACE_DETECTOR_CONFIG
from utils import serialize_faces
from hooks import (
    process_face_detection,
    process_face_tracking,
    process_liveness_detection,
)
from utils.websocket_manager import manager, notification_manager
from services.live_stream_service import LiveStreamService
from time_utils import local_now
import core.lifespan as lifespan

if not logging.getLogger().handlers:
    logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# Allow UUIDs, ULIDs, or short alphanumeric+dash identifiers (max 64 chars).
_CLIENT_ID_RE = re.compile(r"^[a-zA-Z0-9_\-]{1,64}$")


def _is_valid_client_id(client_id: str) -> bool:
    """Validate client_id against a safe character set to prevent log injection."""
    return bool(_CLIENT_ID_RE.match(client_id))


def is_authorized_websocket(websocket: WebSocket) -> bool:
    """Validate WebSocket connections using the same token mechanism as HTTP.

    Uses the effective token from main.py (env var or startup nonce) to ensure
    WebSocket connections are never unauthenticated, even in development.
    """
    from main import _get_effective_token

    provided = websocket.query_params.get("token") or websocket.headers.get(
        "X-Facenox-Token", ""
    )
    return hmac.compare_digest(provided, _get_effective_token())


def get_websocket_organization_id(websocket: WebSocket) -> str | None:
    return normalize_organization_id(websocket.query_params.get("organization_id"))


async def handle_websocket_detect(websocket: WebSocket, client_id: str):
    """Handle WebSocket detection endpoint"""
    if not _is_valid_client_id(client_id):
        logger.warning("[WebSocket] Rejected connection with invalid client_id")
        await websocket.close(code=1008)
        return

    logger.info("[WebSocket] Client %s attempting to connect...", client_id)

    if not is_authorized_websocket(websocket):
        logger.warning(
            "[WebSocket] Unauthorized client %s attempted to connect", client_id
        )
        await websocket.close(code=1008)
        return

    organization_id = get_websocket_organization_id(websocket)
    live_stream_service = LiveStreamService(organization_id)
    await websocket.accept()
    logger.info("[WebSocket] Client %s connected successfully", client_id)

    existing_ws = manager.active_connections.get(client_id)
    if existing_ws is not None and existing_ws is not websocket:
        try:
            await existing_ws.close(code=1000)
        except Exception:
            pass

    manager.active_connections[client_id] = websocket
    if client_id not in manager.connection_metadata:
        manager.connection_metadata[client_id] = {
            "connected_at": local_now(),
            "last_activity": local_now(),
            "message_count": 0,
            "streaming": False,
        }
    else:
        manager.connection_metadata[client_id]["connected_at"] = local_now()
        manager.connection_metadata[client_id]["last_activity"] = local_now()

    if client_id not in manager.fps_tracking:
        manager.fps_tracking[client_id] = {
            "timestamps": [],
            "max_samples": 30,
            "last_update": local_now(),
            "current_fps": 30,
        }

    from core.models import FaceTracker
    from config.models import FACE_TRACKER_CONFIG

    if client_id not in manager.face_trackers:
        manager.face_trackers[client_id] = FaceTracker(
            track_thresh=FACE_TRACKER_CONFIG["track_thresh"],
            match_thresh=FACE_TRACKER_CONFIG["match_thresh"],
            track_buffer=FACE_TRACKER_CONFIG["track_buffer"],
            frame_rate=FACE_TRACKER_CONFIG["frame_rate"],
        )
        logger.info("[WebSocket] Created face tracker for client %s", client_id)

    live_session_config = await live_stream_service.load_initial_config()
    logger.info(
        "[WebSocket] Initial liveness detection state from DB: %s",
        live_session_config.enable_liveness_detection,
    )

    try:
        await websocket.send_text(
            json.dumps(
                {
                    "type": "connection",
                    "status": "connected",
                    "client_id": client_id,
                    "timestamp": time.time(),
                }
            )
        )
        logger.info("[WebSocket] Sent connection confirmation to client %s", client_id)

        logger.info("[WebSocket] Starting message loop for client %s", client_id)

        while True:
            try:
                message_data = await websocket.receive()

                if "text" in message_data:
                    message = json.loads(message_data["text"])

                    if message.get("type") == "ping":
                        if client_id in manager.connection_metadata:
                            manager.connection_metadata[client_id]["last_activity"] = (
                                local_now()
                            )
                        await websocket.send_text(
                            json.dumps(
                                {
                                    "type": "pong",
                                    "client_id": client_id,
                                    "timestamp": time.time(),
                                }
                            )
                        )
                        continue

                    if message.get("type") == "disconnect":
                        logger.info(
                            f"[WebSocket] Client {client_id} requested disconnect"
                        )
                        break

                    elif message.get("type") == "config":
                        live_stream_service.apply_config_message(
                            live_session_config, message
                        )

                        await websocket.send_text(
                            json.dumps(
                                {
                                    "type": "config_ack",
                                    "success": True,
                                    "group_id": live_session_config.active_group_id,
                                    "timestamp": time.time(),
                                }
                            )
                        )
                        continue

                elif "bytes" in message_data:
                    if client_id in manager.connection_metadata:
                        manager.connection_metadata[client_id]["last_activity"] = (
                            local_now()
                        )
                    start_time = time.time()
                    frame_bytes = message_data["bytes"]

                    nparr = np.frombuffer(frame_bytes, np.uint8)
                    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

                    if image is None:
                        await websocket.send_text(
                            json.dumps(
                                {
                                    "type": "error",
                                    "message": "Failed to decode frame",
                                    "timestamp": time.time(),
                                }
                            )
                        )
                        continue

                    min_face_size = FACE_DETECTOR_CONFIG["min_face_size"]

                    faces = await process_face_detection(
                        image,
                        confidence_threshold=FACE_DETECTOR_CONFIG["score_threshold"],
                        nms_threshold=FACE_DETECTOR_CONFIG["nms_threshold"],
                        min_face_size=min_face_size,
                        enable_liveness=live_session_config.enable_liveness_detection,
                    )

                    current_fps = manager.update_fps(client_id)
                    faces = process_face_tracking(faces, image, current_fps, client_id)
                    faces = await process_liveness_detection(
                        faces,
                        image,
                        live_session_config.enable_liveness_detection,
                        tracking_namespace=client_id,
                    )

                    attendance_messages = (
                        await live_stream_service.process_live_recognition(
                            image, faces, live_session_config, client_id
                        )
                    )

                    serialized_faces = serialize_faces(faces, "websocket")

                    processing_time = time.time() - start_time

                    current_timestamp = time.time()
                    response_data = {
                        "type": "detection_response",
                        "faces": serialized_faces,
                        "model_used": "face_detector",
                        "processing_time": processing_time,
                        "timestamp": current_timestamp,
                        "frame_timestamp": current_timestamp,
                        "success": True,
                    }

                    # Calculate suggested_skip based on processing time
                    if processing_time * 1000 > 50:
                        suggested_skip = 2
                    elif processing_time * 1000 > 30:
                        suggested_skip = 1
                    else:
                        suggested_skip = 0

                    response_data["suggested_skip"] = suggested_skip

                    await websocket.send_text(json.dumps(response_data))
                    for attendance_message in attendance_messages:
                        await websocket.send_text(json.dumps(attendance_message))

            except WebSocketDisconnect:
                logger.info(
                    "[WebSocket] Client %s disconnected (inner loop - WebSocketDisconnect exception)",
                    client_id,
                )
                break
            except Exception as e:
                error_str = str(e).lower()
                if "disconnect" in error_str or "close" in error_str:
                    logger.info(
                        "[WebSocket] Client %s disconnected due to connection error: %s",
                        client_id,
                        e,
                    )
                    break

                logger.error(
                    "[WebSocket] Detection processing error for client %s: %s",
                    client_id,
                    e,
                )
                try:
                    await websocket.send_text(
                        json.dumps(
                            {
                                "type": "error",
                                "message": f"Detection failed: {str(e)}",
                                "timestamp": time.time(),
                            }
                        )
                    )
                except (WebSocketDisconnect, RuntimeError) as send_error:
                    logger.info(
                        "[WebSocket] Client %s disconnected during error handling: %s",
                        client_id,
                        send_error,
                    )
                    break

    except WebSocketDisconnect:
        logger.info(
            "[WebSocket] Client %s disconnected (outer exception - WebSocketDisconnect)",
            client_id,
        )
    except Exception as e:
        error_str = str(e).lower()
        if (
            "disconnect" not in error_str
            and "close" not in error_str
            and "send" not in error_str
        ):
            logger.error("[WebSocket] Detection error for client %s: %s", client_id, e)
        else:
            logger.info(
                "[WebSocket] Client %s disconnected due to exception: %s",
                client_id,
                e,
            )
    finally:
        if lifespan.liveness_detector:
            lifespan.liveness_detector.clear_namespace(client_id)
        if manager.active_connections.get(client_id) is websocket:
            await manager.disconnect(client_id)
        logger.info("[WebSocket] Detection endpoint closed for client %s", client_id)


async def handle_websocket_notifications(websocket: WebSocket, client_id: str):
    """Handle WebSocket notifications endpoint"""
    if not _is_valid_client_id(client_id):
        logger.warning(
            "[WebSocket] Rejected notification connection with invalid client_id"
        )
        await websocket.close(code=1008)
        return

    if not is_authorized_websocket(websocket):
        logger.warning(
            "[WebSocket] Unauthorized notifications client %s attempted to connect",
            client_id,
        )
        await websocket.close(code=1008)
        return

    existing_ws = notification_manager.active_connections.get(client_id)
    if existing_ws is not None and existing_ws is not websocket:
        try:
            await existing_ws.close(code=1000)
        except Exception:
            pass

    await notification_manager.connect(websocket, client_id, enable_tracking=False)

    try:
        while True:
            message_data = await websocket.receive()

            if "text" in message_data:
                message = json.loads(message_data["text"])

                if message.get("type") == "ping":
                    await notification_manager.send_personal_message(
                        {
                            "type": "pong",
                            "client_id": client_id,
                            "timestamp": time.time(),
                        },
                        client_id,
                    )

                if message.get("type") == "disconnect":
                    break

    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error("WebSocket notification error: %s", e)
    finally:
        if notification_manager.active_connections.get(client_id) is websocket:
            await notification_manager.disconnect(client_id)


@router.websocket("/ws/detect/{client_id}")
async def websocket_detect_endpoint(websocket: WebSocket, client_id: str):
    """WebSocket endpoint for real-time face detection"""
    await handle_websocket_detect(websocket, client_id)


@router.websocket("/ws/notifications/{client_id}")
async def websocket_notifications_endpoint(websocket: WebSocket, client_id: str):
    """WebSocket endpoint for notifications"""
    await handle_websocket_notifications(websocket, client_id)
