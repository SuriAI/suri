<a id="readme-top"></a>

<h1 align="center">
  <img src="docs/assets/header.png" alt="Facenox - Offline-first Face Recognition Software" width="100%">
</h1>

<p align="center">
  <img src="https://img.shields.io/badge/license-AGPL--3.0-22d3ee?style=flat-square" alt="License">
  <img src="https://img.shields.io/github/v/release/facenox/facenox?style=flat-square&color=22d3ee" alt="Version">
  <img src="https://img.shields.io/github/stars/facenox/facenox?style=flat-square&color=22d3ee" alt="Stars">
  <img src="https://img.shields.io/github/issues/facenox/facenox?style=flat-square&color=22d3ee" alt="Issues">
  <a href="https://github.com/sponsors/facenox"><img src="https://img.shields.io/badge/sponsor-%E2%9D%A4-22d3ee?style=flat-square&labelColor=30363d" alt="Sponsor"></a>
</p>

<p align="center">
  <strong>Facenox is offline-first face recognition software for real-time attendance tracking.</strong><br>
  Built for privacy. It handles detection, matching, and liveness checks entirely on your local hardware so your biometric data never leaves your device.
</p>

<p align="center">
  <img src="docs/assets/screenshots/02-face-recognition-live.png" alt="Facenox Desktop UI - Active Scan" width="100%">
</p>

---

> [!CAUTION]  
> This is the official open source repository for Facenox. Treat other repositories, installers, and downloads as unverified unless they come from official sources.

> [!NOTE]  
> **Privacy First:** Facenox is built on the principle that you should own your biometric data. Detection, tracking, and matching happen entirely on your local hardware.

## Why Facenox

Most face recognition systems rely on cloud-based biometrics. Facenox doesn't. Biometric matching stays local on the desktop.

| Feature                 |  Facenox   | Cloud-Based Systems |
| :---------------------- | :--------: | :-----------------: |
| **Data Residency**      | 100% Local |    Remote Cloud     |
| **Internet Dependency** |  Optional  |      Mandatory      |
| **Latency**             | Real-time  |  Network Dependent  |
| **Privacy Risk**        | Minimized  |        High         |

## Features

- **Local Biometrics:** Face detection and recognition, subject tracking (via ByteTrack), and liveness checks (via [face-antispoof-onnx](https://github.com/facenox/face-antispoof-onnx)).
- **Cross-Platform:** Native support for Windows, macOS, and Linux.
- **Consent-Aware:** Built-in support for biometric enrollment and deletion consent.
- **Subject Management:** Full control over group and member directories.
- **Attendance Tracking:** Automated session recording and CSV/JSON exports.
- **Secure Storage:** Encrypted local biometric storage and password-protected `.facenox` backups.
- **Optional Sync:** Secure pairing with Facenox Dashboard for centralized reporting without uploading raw biometric data.

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
> **Privacy Assurance:** Remote Sync and Dashboard pairing only push attendance snapshots and metadata. Facenox **never uploads raw face images or face embeddings** to the cloud; matching always stays on your hardware.

## How it works

### Where is the data stored?

Everything is stored in a local SQLite database on your machine. Biometric templates are encrypted at rest.

### Does it need the internet?

No. All biometric processing (face detection, recognition, liveness checks, and tracking) works 100% locally. Internet is only required if you choose to sync attendance metadata to the optional Facenox Dashboard.

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
> - **Automated Audits:** Every commit is analyzed by [GitHub CodeQL](https://codeql.github.com/) to detect and prevent security vulnerabilities.
> - **Build Transparency:** All release binaries are built automatically via GitHub Actions. This ensures that the software you download is a direct, untampered reflection of the open-source code in this repository.
> - **Privacy First:** We follow a "Zero-Knowledge" architecture. Your biometric data never leaves your device.

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
