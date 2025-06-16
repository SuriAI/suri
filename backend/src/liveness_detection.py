import cv2
import mediapipe as mp

mp_face_mesh = mp.solutions.face_mesh
mp_drawing_utils = mp.solutions.drawing_utils

# Init Face Mesh Detector
face_mesh = mp_face_mesh.FaceMesh(
    static_image_mode=False, 
    max_num_faces=1, 
    min_detection_confidence=0.5
)

# Check if Real Face is present
def liveness_detection(frame):
    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    result = face_mesh.process(frame_rgb)
    return bool(result.multi_face_landmarks)

capture = cv2.VideoCapture(0)

while True:
    success, frame = capture.read()
    if not success:
        print("Error: Could not read frame from camera.")
        break
    
    liveness = liveness_detection(frame)
    label = "Real" if liveness else "Fake"

    cv2.putText(
        frame,  # The image/frame where text is drawn
        label,  # The actual text to display ("Real" or "Fake")
        (50, 50),  # Position: (x, y) coordinates of the text
        cv2.FONT_HERSHEY_SIMPLEX,  # Font type (default readable font)
        1,  # Font scale
        (0, 255, 0) if liveness else (0, 0, 255),  # Text color (Green if real, Red if fake)
        2  # Text boldness
    )


    cv2.imshow("LIVENESS DETECTION", frame)

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

capture.release()
cv2.destroyAllWindows()
