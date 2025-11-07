import os
import cv2 as cv
import numpy as np
import logging as log
from typing import List

logger = log.getLogger(__name__)


class FaceDetector:
    def __init__(
        self,
        model_path: str,
        input_size: tuple,
        conf_threshold: float,
        nms_threshold: float,
        top_k: int,
        min_face_size: int,
    ):
        self.model_path = model_path
        self.input_size = input_size
        self.detector = None

        # Set attributes via setters
        self.set_score_threshold(conf_threshold)
        self.set_nms_threshold(nms_threshold)
        self.set_top_k(top_k)
        self.set_min_face_size(min_face_size)

        if model_path and os.path.isfile(model_path):
            try:
                self.detector = cv.FaceDetectorYN.create(
                    self.model_path,
                    "",  # Empty for ONNX - params passed directly
                    self.input_size,
                    self.conf_threshold,
                    self.nms_threshold,
                    self.top_k,
                )
            except Exception as e:
                logger.error(f"Error loading face detector model: {e}")

    def detect_faces(self, image: np.ndarray) -> List[dict]:
        if not self.detector or image is None or image.size == 0:
            logger.warning("Invalid image provided to face detector")
            return []

        orig_height, orig_width = image.shape[:2]

        self.detector.setInputSize((orig_width, orig_height))
        faces = self.detector.detect(image)[1]

        if faces is None or len(faces) == 0:
            return []

        detections = []
        for face in faces:
            x, y, w, h = face[:4]
            landmarks_5 = face[4:14].reshape(5, 2)
            conf = float(face[14])

            # Keep float precision until final conversion
            x1_unclipped = float(x)
            y1_unclipped = float(y)
            x2_unclipped = float(x + w)
            y2_unclipped = float(y + h)

            original_width = x2_unclipped - x1_unclipped
            original_height = y2_unclipped - y1_unclipped
            original_area = original_width * original_height

            x1_orig = max(0, x1_unclipped)
            y1_orig = max(0, y1_unclipped)
            x2_orig = min(orig_width, x2_unclipped)
            y2_orig = min(orig_height, y2_unclipped)

            face_width_orig = x2_orig - x1_orig
            face_height_orig = y2_orig - y1_orig
            clipped_area = face_width_orig * face_height_orig

            # Use epsilon to avoid division by zero
            visibility_ratio = clipped_area / (original_area + 1e-6)

            # Clamp minimum threshold for very small images (e.g., 160x120 webcam)
            edge_threshold_x = max(orig_width * 0.05, 10)
            edge_threshold_y = max(orig_height * 0.05, 10)
            is_near_edge = (
                x1_orig < edge_threshold_x
                or y1_orig < edge_threshold_y
                or x2_orig > (orig_width - edge_threshold_x)
                or y2_orig > (orig_height - edge_threshold_y)
            )

            # Vectorized clipping avoids mutating read-only arrays (safer, faster)
            landmarks_5 = np.clip(
                landmarks_5, [0, 0], [orig_width - 1, orig_height - 1]
            )

            landmarks_near_edge = np.any(
                (landmarks_5[:, 0] < edge_threshold_x)
                | (landmarks_5[:, 1] < edge_threshold_y)
                | (landmarks_5[:, 0] > orig_width - edge_threshold_x)
                | (landmarks_5[:, 1] > orig_height - edge_threshold_y)
            )

            is_bounding_box_too_small = self.min_face_size > 0 and (
                face_width_orig < self.min_face_size
                or face_height_orig < self.min_face_size
            )

            liveness_detection_enabled = self.min_face_size > 0

            # Convert to int at final step to preserve precision
            detection = {
                "bbox": {
                    "x": int(x1_orig),
                    "y": int(y1_orig),
                    "width": int(face_width_orig),
                    "height": int(face_height_orig),
                },
                "confidence": conf,
                "landmarks_5": landmarks_5.tolist(),
            }

            # Check visibility first, then edge cases
            if is_bounding_box_too_small:
                detection["liveness"] = {
                    "is_real": False,
                    "status": "too_small",
                    "decision_reason": f"Face too small ({face_width_orig}x{face_height_orig}px) for reliable liveness detection (minimum: {self.min_face_size}px)",
                }
            elif liveness_detection_enabled:
                if visibility_ratio < 0.50:
                    detection["liveness"] = {
                        "is_real": False,
                        "status": "fake",
                        "decision_reason": f"Face critically low visibility (visibility: {visibility_ratio:.1%}) - insufficient quality for reliable liveness detection",
                    }
                elif is_near_edge or landmarks_near_edge:
                    detection["liveness"] = {
                        "is_real": False,
                        "status": "fake",
                        "decision_reason": f"Face at edge with partial visibility (visibility: {visibility_ratio:.1%}) - insufficient quality for reliable liveness detection",
                    }

            detections.append(detection)

        return detections

    def set_input_size(self, input_size):
        """Update input size"""
        self.input_size = input_size
        if self.detector:
            self.detector.setInputSize(input_size)

    def set_score_threshold(self, threshold):
        """Update confidence threshold"""
        self.conf_threshold = threshold
        if self.detector:
            self.detector.setScoreThreshold(threshold)

    def set_nms_threshold(self, threshold):
        """Update NMS threshold"""
        self.nms_threshold = threshold
        if self.detector:
            self.detector.setNMSThreshold(threshold)

    def set_top_k(self, top_k):
        """Update maximum number of detections"""
        self.top_k = top_k
        if self.detector:
            self.detector.setTopK(top_k)

    def set_confidence_threshold(self, threshold):
        """Update confidence threshold (alias for set_score_threshold)"""
        self.set_score_threshold(threshold)

    def set_min_face_size(self, min_size: int):
        """Set minimum face size for liveness detection compatibility"""
        self.min_face_size = min_size

    def get_model_info(self):
        """Get model information"""
        return {
            "model_path": self.model_path,
            "input_size": self.input_size,
            "conf_threshold": self.conf_threshold,
            "nms_threshold": self.nms_threshold,
            "top_k": self.top_k,
            "min_face_size": self.min_face_size,
            "liveness_detection_compatible": True,
            "size_filter_description": f"Faces smaller than {self.min_face_size}px are filtered for liveness detection model compatibility",
        }
