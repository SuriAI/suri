import cv2 as cv
import numpy as np
import onnxruntime as ort
from time import time
from typing import List

# ===== CONFIG =====
REL_PATH = "experiments/models/"
MODEL = "wider300e+300e-unisets.onnx"
CONF_THRESH = 0.3
IOU_THRESH = 0.4
INPUT_SIZE = 640

# ===== INIT ONNX SESSION =====
print("[INFO] Loading ONNX model...")
session = ort.InferenceSession(f"{REL_PATH}{MODEL}")
get = session.get_inputs()[0]
input_name = get.name
print(f"[INFO] Input shape: {get.shape}")
print(f"[INFO] Output shape: {get.shape}")

# ===== NMS =====
def nms(boxes: np.ndarray, scores: np.ndarray, iou_threshold: float) -> List[int]:
    x1, y1, x2, y2 = boxes.T
    areas = (x2 - x1) * (y2 - y1)
    order = scores.argsort()[::-1]

    keep = []
    while order.size > 0:
        i = order[0]
        keep.append(i)
        xx1 = np.maximum(x1[i], x1[order[1:]])
        yy1 = np.maximum(y1[i], y1[order[1:]])
        xx2 = np.minimum(x2[i], x2[order[1:]])
        yy2 = np.minimum(y2[i], y2[order[1:]])
        inter = np.clip(xx2 - xx1, 0, None) * np.clip(yy2 - yy1, 0, None)
        iou = inter / (areas[i] + areas[order[1:]] - inter)
        order = order[np.where(iou <= iou_threshold)[0] + 1]
    return keep

# ===== DECODE =====
def decode_outputs(output, conf_thresh=0.3, iou_thresh=0.45):
    output = np.transpose(output, (0, 2, 1))[0]
    boxes = output[:, :4]
    confs = output[:, 4]
    mask = confs > conf_thresh
    boxes, confs = boxes[mask], confs[mask]

    if boxes.shape[0] == 0:
        if decode_outputs.prev_count != 0:
            print("[INFO] No faces detected.")
            decode_outputs.prev_count = 0
        return np.empty((0, 5))

    x_c, y_c, w, h = boxes[:, 0], boxes[:, 1], boxes[:, 2], boxes[:, 3]
    x1, y1 = x_c - w / 2, y_c - h / 2
    x2, y2 = x_c + w / 2, y_c + h / 2
    boxes = np.stack([x1, y1, x2, y2], axis=1)

    indices = nms(boxes, confs, iou_thresh)

    if decode_outputs.prev_count != len(indices):
        print(f"[INFO] {len(indices)} face(s) detected.")
        decode_outputs.prev_count = len(indices)

    return np.concatenate([boxes[indices], confs[indices, None]], axis=1)

# init counter
decode_outputs.prev_count = -1

# ===== MAIN LOOP =====
cap = cv.VideoCapture(0)
frame_id = 0
fps_start = time()

try:
    while True:
        ret, frame = cap.read()
        if not ret:
            print("[WARN] Failed to read frame from webcam.")
            break
        frame_id += 1
        original_h, original_w = frame.shape[:2]

        img = cv.resize(frame, (INPUT_SIZE, INPUT_SIZE))
        img_input = img.astype(np.float32) / 255.0
        img_input = np.transpose(img_input, (2, 0, 1))
        img_input = np.expand_dims(img_input, axis=0)

        outputs = session.run(None, {input_name: img_input})
        boxes = decode_outputs(outputs[0], CONF_THRESH, IOU_THRESH)

        for i, box in enumerate(boxes):
            x1, y1, x2, y2, conf = box
            x1 = int(x1 / INPUT_SIZE * original_w)
            y1 = int(y1 / INPUT_SIZE * original_h)
            x2 = int(x2 / INPUT_SIZE * original_w)
            y2 = int(y2 / INPUT_SIZE * original_h)

            color = (0, int(255 * conf), 0)
            cv.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            cv.putText(frame, f"{conf:.2f}", (x1, y1 - 8), cv.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
            print(f"[LOG] Drawn face #{i + 1} with confidence {conf:.2f} at [{x1}, {y1}, {x2}, {y2}]")

        fps = frame_id / (time() - fps_start)
        cv.putText(frame, f"FPS: {fps:.0f}", (10, 25), cv.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
        cv.imshow("YOLOv8-Face ONNX Live", frame)

        if cv.waitKey(1) & 0xFF == ord('q'):
            print("[INFO] Quit key pressed.")
            break
except KeyboardInterrupt:
    print("[INFO] Interrupted manually.")

cap.release()
cv.destroyAllWindows()
