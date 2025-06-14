import cv2

#prebuilt haarcascade for face detection
front_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
whole_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_profileface.xml")
capture = cv2.VideoCapture(0)
while True:
    # Capture frame-by-frame
    success, frame = capture.read()
    if not success:
        print("Error: Could not read frame from camera.")
        break
    # Convert frame to grayscale and detect faces
    # img = cv2.imread("/backend/assets/classroom_withstudents.png")
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    front_frames = frame.copy()
    front_faces = front_cascade.detectMultiScale(gray, scaleFactor=1.2, minNeighbors=5)
    for (x, y, w, h) in front_faces:
        cv2.rectangle(front_frames, (x, y), (x + w, y + h), (255, 0, 0), 2)
    whole_frames = frame.copy()
    whole_faces = whole_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5)
    for (x, y, w, h) in whole_faces:
        cv2.rectangle(whole_frames, (x, y), (x + w, y + h), (255, 255, 0), 2)

    cv2.imshow("Front Face Detection", front_frames)
    cv2.imshow("Whole Face Detection", whole_frames)
    # q and ESC keys to exit
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

# to avoid memory leaks and still "in use" of webcam after window close
capture.release()
cv2.destroyAllWindows()