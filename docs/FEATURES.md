# Features

Suri provides a local attendance system focused on speed and data security.

## Core Recognition Engine

### Biometric Authentication
Uses a pipeline of neural networks to verify identity.
- **Fast Detection**: Uses lightweight models (RetinaFace) to find faces in **<10ms**.
- **Liveness Detection**: Analyzes depth and texture to block photos, screens, and masks.
- **Vector Matching**: Extracts a **512-dimensional vector** for comparison using Cosine Similarity. Handles glasses and partial occlusion.

### Identity Tracking (ByteTrack)
Maintains identity consistency across video frames using **ByteTrack**.
- **Robust Association**: Utilizes all detection boxes (high and low confidence) to handle occlusion and motion blur effectively.
- **Trajectory Prediction**: Uses **Kalman Filtering** to smooth movement and predict positions.

## Management Tools

### Configuration
- **Grouping**: Organize users into Classes, Teams, or Zones.
- **Attendance Rules**: Define specific times for "Late", "Absent", or "Present" status.

### Real-Time Monitoring
- **Live Dashboard**: View attendance status as it happens.
- **Analytics**: Visualization of attendance frequency over time.

## Data Export

- **CSV Export**: Download raw attendance logs for external processing (Excel, ERPS).
- **PDF Reports**: Generate printable audit logs.
