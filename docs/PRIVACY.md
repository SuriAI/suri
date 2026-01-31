# Privacy and Data Security

Suri uses a local-first architecture. Biometric data is stored on the machine and is not sent to external servers.

## Privacy Approach

### 1. Local Processing
- **Device-Only**: Detection and recognition run on the local CPU/GPU.
- **Offline**: No internet connection needed for core functionality.
- **No External APIs**: Does not use cloud AI services.

### 2. Data Storage
- **RAM Processing**: Video frames are processed in memory and discarded.
- **Vector Storage**: Stores **512-dimensional embeddings** (mathematical representations), not original face images.
- **Database**: Uses a local SQLite file.

## Data Control

### Usage
- **Deletion**: Removing a member permanently deletes the vector data.
- **Retention**: Options available to clear old logs.

### Transparency
- **Open Source**: The codebase is available for audit under the AGPLv3 license.

## Security Recommendations

For secure deployments:
- **Disk Encryption**: Use tools like **BitLocker** (Windows) or **FileVault** (macOS).
- **Network**: Run on a private network if possible.
- **Access**: Restrict physical access to the machine.
