"""
Face processing hooks for the API
Handles face detection, liveness detection and face tracking processing
"""

import asyncio
import logging
from concurrent.futures import ThreadPoolExecutor
from typing import Dict, List, Optional

import numpy as np

logger = logging.getLogger(__name__)

# Global references to models (set from main.py)
liveness_detector = None
face_recognizer = None
face_detector = None

# Dedicated executor for CPU-bound model inference
_model_executor: Optional[ThreadPoolExecutor] = None


def init_model_executor(max_workers: int = 4):
    """Initialize the dedicated executor for model inference"""
    global _model_executor
    if _model_executor is None:
        _model_executor = ThreadPoolExecutor(
            max_workers=max_workers, thread_name_prefix="model"
        )
        logger.info(f"Initialized model executor with {max_workers} workers")


def shutdown_model_executor():
    """Shutdown the model executor"""
    global _model_executor
    if _model_executor:
        _model_executor.shutdown(wait=True)
        _model_executor = None
        logger.info("Shutdown model executor")


def get_model_executor() -> ThreadPoolExecutor:
    """Get the model executor, initializing if needed"""
    if _model_executor is None:
        init_model_executor()
    return _model_executor


def set_model_references(liveness, tracker, recognizer, detector=None):
    """Set global model references from main.py"""
    global liveness_detector, face_recognizer, face_detector
    liveness_detector = liveness
    face_recognizer = recognizer
    face_detector = detector


async def process_face_detection(
    image: np.ndarray,
    confidence_threshold: Optional[float] = None,
    nms_threshold: Optional[float] = None,
    min_face_size: Optional[int] = None,
) -> List[Dict]:
    """
    Process face detection asynchronously.

    Args:
        image: Input image (BGR format)
        confidence_threshold: Optional confidence threshold override
        nms_threshold: Optional NMS threshold override
        min_face_size: Optional minimum face size override

    Returns:
        List of face detection dictionaries
    """
    if not face_detector:
        logger.warning("Face detector not available")
        return []

    try:
        loop = asyncio.get_event_loop()
        executor = get_model_executor()

        def _detect():
            if confidence_threshold is not None:
                face_detector.set_confidence_threshold(confidence_threshold)
            if nms_threshold is not None:
                face_detector.set_nms_threshold(nms_threshold)
            if min_face_size is not None:
                face_detector.set_min_face_size(min_face_size)

            return face_detector.detect_faces(image)

        faces = await loop.run_in_executor(executor, _detect)
        return faces

    except Exception as e:
        logger.error(f"Face detection failed: {e}", exc_info=True)
        return []


async def process_liveness_detection(
    faces: List[Dict], image: np.ndarray, enable: bool
) -> List[Dict]:
    """Helper to process liveness detection across all endpoints"""
    if not (enable and faces and liveness_detector):
        return faces

    try:
        loop = asyncio.get_event_loop()
        executor = get_model_executor()
        faces_with_liveness = await loop.run_in_executor(
            executor, liveness_detector.detect_faces, image, faces
        )
        return faces_with_liveness

    except Exception as e:
        logger.error(f"Liveness detection failed: {e}", exc_info=True)
        for face in faces:
            if "liveness" not in face:
                face["liveness"] = {
                    "is_real": False,
                    "live_score": 0.0,
                    "spoof_score": 1.0,
                    "confidence": 0.0,
                    "status": "error",
                    "message": f"Liveness detection error: {str(e)}",
                }
            elif face["liveness"].get("status") not in ["live", "spoof"]:
                face["liveness"]["status"] = "error"
                face["liveness"]["message"] = f"Liveness detection error: {str(e)}"

    return faces


async def process_face_tracking(
    faces: List[Dict],
    image: np.ndarray,
    frame_rate: int = None,
    client_id: str = None,
) -> List[Dict]:
    """
    Process face tracking for WebSocket video streams.
    Requires client_id for per-client tracker isolation.

    Args:
        faces: List of face detections
        image: Input image (unused)
        frame_rate: Optional frame rate
        client_id: Required client ID for per-client tracker
    """
    if not faces:
        return faces

    if not client_id:
        logger.warning(
            "process_face_tracking called without client_id - skipping tracking"
        )
        for face in faces:
            if "track_id" not in face:
                face["track_id"] = -1
        return faces

    from utils.websocket_manager import manager

    tracker = manager.get_face_tracker(client_id)

    if not tracker:
        logger.warning(f"No tracker found for client {client_id}")
        for face in faces:
            if "track_id" not in face:
                face["track_id"] = -1
        return faces

    try:
        loop = asyncio.get_event_loop()
        executor = get_model_executor()
        tracked_faces = await loop.run_in_executor(
            executor, tracker.update, faces, frame_rate
        )

        return tracked_faces

    except Exception as e:
        logger.warning(f"Face tracking failed: {e}")
        for face in faces:
            if "track_id" not in face:
                face["track_id"] = -1
        return faces


async def process_liveness_for_face_operation(
    image: np.ndarray,
    bbox: list,
    enable_liveness_detection: bool,
    operation_name: str,
) -> tuple[bool, str | None]:
    """
    Process liveness detection for face recognition/registration operations.
    Returns (should_block, error_message)
    """
    from core.lifespan import liveness_detector

    if not (liveness_detector and enable_liveness_detection):
        return False, None

    if not isinstance(bbox, list) or len(bbox) < 4:
        return True, f"{operation_name} blocked: invalid bbox format"

    temp_face = {
        "bbox": {
            "x": bbox[0],
            "y": bbox[1],
            "width": bbox[2],
            "height": bbox[3],
        },
        "confidence": 1.0,
        "track_id": -1,
    }

    loop = asyncio.get_event_loop()
    executor = get_model_executor()
    liveness_results = await loop.run_in_executor(
        executor, liveness_detector.detect_faces, image, [temp_face]
    )

    if liveness_results and len(liveness_results) > 0:
        liveness_data = liveness_results[0].get("liveness", {})
        is_real = liveness_data.get("is_real", False)
        status = liveness_data.get("status", "unknown")

        if not is_real or status == "spoof":
            return (
                True,
                f"{operation_name} blocked: spoofed face detected (status: {status})",
            )

        if status in ["too_small", "error"]:
            logger.warning(f"{operation_name} blocked for face with status: {status}")
            return True, f"{operation_name} blocked: face status {status}"

    return False, None
