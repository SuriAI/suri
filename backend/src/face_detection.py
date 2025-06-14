import cv2

#prebuilt haarcascade for face detection
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
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
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5)
    for (x, y, w, h) in faces:
        cv2.rectangle(frame, (x, y), (x + w, y + h), (255, 0, 0), 2)
    cv2.imshow("Face Detection", frame)
    # q and ESC keys to exit
    if cv2.waitKey(1) & 0xFF == ord("q") or cv2.waitKey(1) & 0xFF == 27:
        break

# to avoid memory leaks and still "in use" of webcam after window close
capture.release()
cv2.destroyAllWindows()