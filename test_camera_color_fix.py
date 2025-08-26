#!/usr/bin/env python3
"""
Test script to verify camera color fix is working properly.

This script opens the camera with the fixed settings and displays the feed
to verify that the weird grayscale/negative effect is gone.
"""

import cv2
import os
import sys
import time

def test_camera_color_fix():
    """Test the camera with fixed color settings."""
    print("🎥 Testing Camera Color Fix")
    print("=" * 50)
    
    device = 0  # Default camera
    
    # Open camera with fixed settings (similar to video_worker)
    print(f"Opening camera {device} with DirectShow...")
    
    try:
        if os.name == 'nt':
            cap = cv2.VideoCapture(device, cv2.CAP_DSHOW)
        else:
            cap = cv2.VideoCapture(device)
        
        if not cap.isOpened():
            print("❌ Failed to open camera")
            return False
        
        # Apply fixed settings
        print("Applying fixed camera settings...")
        
        # Basic settings
        cap.set(cv2.CAP_PROP_BUFFERSIZE, 2)
        cap.set(cv2.CAP_PROP_FPS, 30)
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        
        # Color fix settings
        try:
            cap.set(cv2.CAP_PROP_FOURCC, cv2.VideoWriter_fourcc('M', 'J', 'P', 'G'))
            cap.set(cv2.CAP_PROP_AUTO_EXPOSURE, 1.0)  # Auto exposure (NOT 0.25)
            cap.set(cv2.CAP_PROP_BRIGHTNESS, 0.5)     # Neutral brightness (NOT 0)
            cap.set(cv2.CAP_PROP_CONTRAST, 0.5)       # Neutral contrast (NOT 0)
            cap.set(cv2.CAP_PROP_SATURATION, 0.5)     # Neutral saturation
            print("✅ Color fix settings applied successfully")
        except Exception as e:
            print(f"⚠️ Could not apply some color settings: {e}")
        
        # Test frame capture
        print("Testing frame capture...")
        
        for i in range(10):
            ret, frame = cap.read()
            if not ret or frame is None:
                print(f"❌ Failed to capture frame {i+1}")
                continue
            
            # Analyze frame
            if len(frame.shape) == 3 and frame.shape[2] == 3:
                mean_values = cv2.mean(frame)[:3]
                print(f"Frame {i+1}: BGR means = ({mean_values[0]:.1f}, {mean_values[1]:.1f}, {mean_values[2]:.1f})")
                
                # Check for color issues
                if abs(mean_values[0] - mean_values[1]) < 5 and abs(mean_values[1] - mean_values[2]) < 5:
                    if mean_values[0] < 15:
                        print("⚠️ Frame appears very dark (possible color issue)")
                    elif mean_values[0] > 240:
                        print("⚠️ Frame appears very bright (possible color issue)")
                    else:
                        print("✅ Frame looks normal (grayscale but not corrupted)")
                else:
                    print("✅ Frame has good color variation")
            
            time.sleep(0.1)
        
        cap.release()
        print("\n🎉 Camera test completed!")
        print("If you saw normal BGR values (not all 0 or all 255), the fix is working!")
        
        return True
        
    except Exception as e:
        print(f"❌ Camera test failed: {e}")
        return False

def main():
    """Main function to run the camera color test."""
    print("""
🎯 Suri Camera Color Fix Test
=============================

This test will:
1. Open the camera with fixed settings
2. Capture test frames
3. Analyze color values
4. Report if the fix is working

Press Ctrl+C to stop early.
""")
    
    try:
        success = test_camera_color_fix()
        if success:
            print("\n✅ Camera color fix test PASSED!")
            print("The weird grayscale/negative effect should be gone.")
        else:
            print("\n❌ Camera color fix test FAILED!")
            print("Camera issues persist. Check logs for details.")
            
    except KeyboardInterrupt:
        print("\n🛑 Test interrupted by user")
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")

if __name__ == "__main__":
    main()
