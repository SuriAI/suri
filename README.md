<a id="readme-top"></a>

<h1 align="center">
  <img src="docs/assets/header.png" alt="Facenox - Offline-first Face Recognition Software" width="100%">
</h1>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-AGPL--3.0-a5adb7?style=flat&logo=git&logoColor=f2f5f7&labelColor=0d1117" alt="License"></a>
  <a href="https://github.com/facenox/facenox/releases"><img src="https://img.shields.io/github/v/release/facenox/facenox?style=flat&logo=git&logoColor=f2f5f7&labelColor=0d1117&color=0891b2" alt="Version"></a>
  <a href="https://github.com/facenox/facenox/stargazers"><img src="https://img.shields.io/github/stars/facenox/facenox?style=flat&logo=github&logoColor=f2f5f7&labelColor=0d1117&color=22d3ee" alt="Stars"></a>
  <a href="https://github.com/sponsors/facenox"><img src="https://img.shields.io/badge/sponsor-%E2%9D%A4-ff8a8a?style=flat&logo=github-sponsors&logoColor=f2f5f7&labelColor=0d1117" alt="Sponsor"></a>
</p>

<p align="center">
  <strong>Facenox is offline-first face recognition software for real-time attendance tracking.</strong><br>
  Built for privacy: biometric templates are encrypted client-side and decrypted only on your paired devices.
</p>

<p align="center">
  <img src="docs/assets/screenshots/02-face-recognition-live.png" alt="Facenox Desktop UI - Active Scan" width="100%">
</p>

---

> [!CAUTION]  
> This is the official open source repository for Facenox. Treat other repositories, installers, and downloads as unverified unless they come from official sources.

> [!NOTE]  
> **Privacy First:** Facenox processes face detection, tracking, and template matching locally. Encrypted face templates can optionally sync between your devices: only your organization's paired kiosks hold the decryption keys.

## Why Facenox

Most face recognition systems rely on cloud-based biometrics. Facenox doesn't. Biometric matching stays local on the desktop.

| Feature                 |  Facenox   | Cloud-Based Systems |
| :---------------------- | :--------: | :-----------------: |
| **Data Residency**      | Encrypted End-to-End with Optional Cross-Device Sync |    Remote Cloud     |
| **Internet Dependency** |  Optional  |      Mandatory      |
| **Latency**             | Real-time  |  Network Dependent  |
| **Privacy Risk**        | Minimized  |        High         |

## Features

- **Local Biometrics:** Face detection, ByteTrack subject tracking, and ONNX liveness verification.
- **Cross-Platform:** Native support for Windows, macOS, and Linux.
- **Consent-Aware:** Built-in support for biometric enrollment and deletion consent.
- **Subject Management:** Full control over group and member directories.
- **Attendance Tracking:** Automated session recording and CSV/JSON exports.
- **Secure Storage:** Encrypted local biometric storage and password-protected `.facenox` backups.
- **Optional Sync:** Secure pairing with Facenox Dashboard for centralized reporting. Encrypted face templates can sync between devices, with your organization holding the master encryption key.

## Screenshots

<details>
<summary><strong>Click to expand UI Gallery</strong></summary>

### Main Interface

![Camera Preview](docs/assets/screenshots/01-camera-preview.png)
<br/>
![Face Recognition](docs/assets/screenshots/02-face-recognition-live.png)
_Primary control interface for video hardware setup and active biometric scanning, featuring real-time face detection and multi-subject tracking._

### Overview

![Attendance Dashboard](docs/assets/screenshots/03-attendance-dashboard.png)
_Overview dashboard displaying real-time metrics for 'Present Today' and 'Late Arrivals' alongside a live Activity Log._

### Reports

![Reports](docs/assets/screenshots/04-reports-management.png)
_Reports interface detailing attendance records, featuring built-in tools for manual session editing and CSV data export._

### Members

![Members](docs/assets/screenshots/05-member-enrollment.png)
_Member management interface for profile administration, role assignment, and biometric enrollment._

### General

![General Settings](docs/assets/screenshots/06-settings-general.png)
_Configuration controls for core attendance mechanics, including Entry/Exit modes, Late Tracking thresholds, Duplicate Prevention cooldowns, and Recognition Limits._

### Security & Compliance

![Security Settings](docs/assets/screenshots/07-settings-security.png)
_Configuration panel for Anti-spoofing (Liveness Verification) toggles, Global Group Consent enforcement, and Data Retention policies._

### Database

![Database Settings](docs/assets/screenshots/08-settings-database-sync.png)
_Database settings panel detailing system clock accuracy validation and enrollment metrics across groups._

### Backup & Export

![Backup Restore](docs/assets/screenshots/09-database-backup-restore.png)
_Backup utilities for exporting and restoring the offline SQLite database and biometric profiles via encrypted archives._

</details>

## Performance

- **No GPU Required:** Real-time matching on standard CPUs.
- **Environment:** Optimized for controlled lighting and consistent setups.
- **Hardware:** Verified on hardware as old as 2nd-gen Intel i7 (2011), 4th-gen i3 (2015), and 8th-gen i5 (2018) laptops.

## Offline-First Behavior

Facenox Desktop continues to work locally when internet access is unavailable:

- Recognition and liveness verification remain functional.
- Attendance is recorded and stored in a local SQLite database.
- Settings, backups, and member management remain accessible.
- Remote Sync and Dashboard pairing resume automatically when connectivity returns.
  (Completely optional; sync is disabled by default and only active when your device is paired.)

> [!NOTE]  
> **Privacy Assurance:** Facenox never uploads raw face images to the cloud. Kiosks encrypt face vectors with AES-256-GCM before sync. The cloud acts as a blind relay; we cannot read your data. Matching always stays on your local hardware.

## How it works

### Where is the data stored?

Everything is stored in a local SQLite database on your machine. Biometric templates are encrypted at rest.

### Does it need the internet?

No. The local FastAPI server processes all camera frames on your machine. Internet connectivity is only required to upload attendance logs or sync encrypted templates to the web dashboard.

### What hardware do I need?

It's designed for standard CPUs and has been tested on hardware as old as 2nd-gen Intel i7 (2011), 4th-gen i3 (2015), and 8th-gen i5 (2018) laptops. No dedicated GPU or CUDA setup is required.

### How do I protect my data?

Since Facenox operates 100% locally, we cannot recover your data if your device is lost or corrupted. We provide a built-in backup utility that exports an encrypted `.facenox` archive. We recommend regular backups to external storage or a secure organizational cloud.

## Roadmap

- [x] Support for cross-platform native installers (Windows, macOS, Linux).
- [x] Attendance trends and site-level reporting in Facenox Dashboard.
- [ ] Software Signing.
- [ ] Mobile companion application for remote monitoring.

---

> [!IMPORTANT]
> **Security & Trust**
>
> - **Automated Audits:** GitHub CodeQL scans commits for security vulnerabilities on every push.
> - **Build Transparency:** GitHub Actions compiles all release binaries from public source code.
> - **Privacy First:** Kiosks encrypt all outbound templates with AES-256-GCM. The database serves as a blind relay; we cannot read your data.

> **Management Dashboard:** The **official Facenox Dashboard** is an optional service for centralized reporting. This repository contains the source for the **desktop client** only.

## Download

Latest prebuilt binaries are available on the [GitHub Releases](https://github.com/facenox/facenox/releases/latest) page.

If you want to build from source, please follow the [Installation Guide](docs/INSTALLATION.md).

## Installation Notes

Facenox is in active development. Until code-signing is finalized in a future release, you may encounter OS security prompts.

> [!WARNING]  
> **Windows SmartScreen:** If blocked, click **More info** then **Run anyway**.
>
> <img src="docs/assets/smartscreen_warning.png" alt="Windows SmartScreen warning" width="350">

> [!TIP]  
> **macOS Gatekeeper:** If blocked, **Right-click** the app, select **Open**, then confirm the prompt.
>
> <img src="docs/assets/macos_gatekeeper_warning.png" alt="macOS Gatekeeper warning" width="350">

## Documentation

- [FEATURES.md](docs/FEATURES.md): Capabilities and out-of-scope items.
- [ARCHITECTURE.md](docs/ARCHITECTURE.md): System design and sync boundaries.
- [INSTALLATION.md](docs/INSTALLATION.md): Local development setup.
- [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md): Common setup and runtime issues.
- [CODE_SIGNING_POLICY.md](docs/CODE_SIGNING_POLICY.md): Release identity and trust rules.
- [PRIVACY.md](docs/PRIVACY.md): Data handling and consent policy.
- [SECURITY.md](SECURITY.md): Vulnerability reporting policy.
- [TESTING.md](app/TESTING.md): Frontend and Electron app testing conventions.

## Tech Stack

### Local Backend

- **Runtime:** Python 3.10+ (FastAPI)
- **Inference:** ONNX Runtime, OpenCV
- **Tracking:** ByteTrack (High-performance MOT)
- **Anti-Spoofing:** [face-antispoof-onnx](https://github.com/facenox/face-antispoof-onnx)
- **Storage:** SQLite, SQLAlchemy, Alembic

### Desktop App

- **Framework:** Electron, React 19
- **Build Tooling:** Vite, TypeScript, Tailwind CSS

## Development Quickstart

```bash
# 1. Clone the repo
git clone https://github.com/facenox/facenox.git
cd facenox

# 2. Setup Local Backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate
pip install -r server/requirements.txt

# 3. Setup Desktop App
pnpm install

# 4. Run Development Workspace
./dev-start.sh
```

## Contributing

Pull requests are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a PR, especially for changes affecting privacy or biometric data.

## Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/)
- [ONNX Runtime](https://onnxruntime.ai/)
- [OpenCV](https://opencv.org/)
- [Electron](https://www.electronjs.org/)
- [React](https://react.dev/)
- [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md)

## License

Facenox is licensed under the **GNU AGPL v3**. See [LICENSE](LICENSE) for details.
