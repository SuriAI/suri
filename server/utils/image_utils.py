"""
Image utility functions for the face detection API
"""

import hashlib

import numpy as np


def calculate_image_hash(image: np.ndarray) -> str:
    """
    Calculate MD5 hash of an image

    Args:
        image: OpenCV image as numpy array

    Returns:
        Hexadecimal MD5 hash string
    """
    return hashlib.md5(image.tobytes()).hexdigest()
