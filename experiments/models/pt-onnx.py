from ultralytics import YOLO

model = YOLO("experiments\models\wider300e+300e-unisets.pt")
model.export(format="onnx")