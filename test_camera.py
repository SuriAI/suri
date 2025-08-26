#!/usr/bin/env python3
"""
Simple camera test script to debug camera issues on Windows.
"""

import cv2
import sys
import os

def test_camera_backends():
    """Test different camera backends and indices"""
    print("Testing camera backends...")
    
    # Test different backends
    backends = [
        ("Default", None),
        ("DirectShow", cv2.CAP_DSHOW),
        ("MSMF", cv2.CAP_MSMF),
    ]
    
    # Test different camera indices
    devices = [0, 1, 2, 3]
    
    for device in devices:
        print(f"\n--- Testing Camera {device} ---")
        
        for backend_name, backend_id in backends:
            print(f"  Trying {backend_name} backend...")
            
            try:
                if backend_id is not None:
                    cap = cv2.VideoCapture(device, backend_id)
                else:
                    cap = cv2.VideoCapture(device)
                
                if cap and cap.isOpened():
                    # Try to read a frame
                    ret, frame = cap.read()
                    if ret and frame is not None and frame.size > 0:
                        print(f"    ✓ SUCCESS: Camera {device} works with {backend_name}")
                        print(f"      Frame size: {frame.shape}")
                        print(f"      Resolution: {int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))}x{int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))}")
                        print(f"      FPS: {cap.get(cv2.CAP_PROP_FPS)}")
                        cap.release()
                        return device, backend_id
                    else:
                        print(f"    ✗ FAILED: Camera {device} opened but no frame with {backend_name}")
                        cap.release()
                else:
                    print(f"    ✗ FAILED: Could not open camera {device} with {backend_name}")
                    
            except Exception as e:
                print(f"    ✗ ERROR: {e}")
    
    print("\nNo working camera found!")
    return None, None

def test_simple_camera():
    """Simple camera test"""
    print("Simple camera test...")
    
    try:
        cap = cv2.VideoCapture(0)
        if cap.isOpened():
            ret, frame = cap.read()
            if ret and frame is not None:
                print("✓ Camera 0 works!")
                cap.release()
                return True
            else:
                print("✗ Camera 0 opened but no frame")
                cap.release()
        else:
            print("✗ Could not open camera 0")
    except Exception as e:
        print(f"✗ Error: {e}")
    
    return False

if __name__ == "__main__":
    print("Camera Test Script")
    print("=" * 50)
    
    # Test simple camera first
    if test_simple_camera():
        print("\nSimple test passed!")
    else:
        print("\nSimple test failed, trying different backends...")
        device, backend = test_camera_backends()
        
        if device is not None:
            print(f"\nWorking configuration found:")
            print(f"  Device: {device}")
            print(f"  Backend: {backend}")
        else:
            print("\nNo working camera configuration found!")
            print("\nTroubleshooting tips:")
            print("1. Make sure your camera is not being used by another application")
            print("2. Check Windows camera permissions")
            print("3. Try updating camera drivers")
            print("4. Restart your computer")

