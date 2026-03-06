# Features

## Core
- **Biometric Authentication**: Multi-stage neural network verification.
- **Liveness Detection**: Anti-spoofing logic for photos, screens, and masks.
- **Fast Detection**: <100ms detection/recognition on standard CPUs.
- **Privacy Shield**: Real-time video blurring for individuals without biometric consent.
- **Identity Tracking**: Kalman filtering for consistent identity maintenance across frames.

## Management Tools
- **Grouping**: Organize users into Classes, Teams, or Zones.
- **Attendance Rules**: Configurable "Late", "Absent", or "Present" logic.
- **Real-Time Dashboards**: Live monitoring of check-in events.
- **Analytics**: Historical visualization of attendance patterns.

## Data & Portability
- **CSV Export**: Raw attendance logs for external processing (Excel, ERP).
- **Encrypted Vaults**: AES-256-GCM encrypted `.suri` files for system backups and biometrics.
- **Enforced Consent**: Persistent, auditable consent tracking that hard-blocks unauthorized biometric capture.

## Suri Cloud (Optional)
Cloud features for multi-site deployments:
- **Zero-Knowledge Sync**: E2EE biometric mirroring. The server never sees raw embeddings.
- **Remote Analytics**: Centralized admin panel for cross-location reports and metrics.
- **Automated Backups**: Continuous cloud vaulting of system state.
