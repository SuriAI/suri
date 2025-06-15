import cv2
from deepface import DeepFace

capture = cv2.VideoCapture(0)

while True:
    success, frame = capture.read()
    cv2.imwrite("temp.jpg", frame)
    try:
        result = DeepFace.find(img_path="temp.jpg", db_path="backend/assets/face_database")
        print("FACE DETECTED", result)
    except Exception as e:
        print("NO FACE DETECTED, error", e)

    cv2.imshow("Face Recognition", frame)
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

capture.release()
cv2.destroyAllWindows()