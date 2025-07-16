from ultralytics import YOLO
import cv2

# Load your YOLOv8n-face model
model = YOLO("backend/assets/models/best.pt")  # or your custom fine-tuned .pt file

# Open your laptop camera
cap = cv2.VideoCapture(0)  # Use 0 for default webcam

while True:
    ret, frame = cap.read()
    if not ret:
        break

    # Run YOLOv8 on the current frame
    results = model.predict(source=frame, conf=0.3, verbose=False)

    # Draw bounding boxes
    for r in results:
        for box in r.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            conf = float(box.conf[0])
            cls = int(box.cls[0])

            # Draw box and confidence
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(frame, f'{model.names[cls]} {conf:.2f}', (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

    # Show live result
    cv2.imshow("SURI Face Detection", frame)

    # Break on 'q' key
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
