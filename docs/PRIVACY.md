# Privacy & Data Sovereignty

Suri treats privacy as a baseline requirement, not a feature. The system runs entirely on local hardware by default. No data leaves the machine unless explicitly authorized. See the [Architecture Guide](ARCHITECTURE.md) for technical verification.

## 1. Zero-Image Storage
Suri never stores face images.

When the camera detects a face, the AI immediately converts it into a set of numbers (a [512-dimensional vector](ARCHITECTURE.md#inference-pipeline)). The original image is then discarded instantly. The database only holds these lists of numbers.

Rebuilding a photo from these vectors is impossible. Even in the event of hardware theft, no personal photos can be compromised.

## 2. Data Sovereignty & Cloud Policy
Data ownership remains strictly with the user.

### Default Offline Operation
By default, Suri operates as a standalone, offline application.
*   **No Telemetry**: The system transmits no usage data.
*   **Local Database**: A standard [SQLite](https://www.sqlite.org/index.html) file holds the records. Backups, access control, and deletion are managed locally.

### Optional Professional Sync
Users may opt-in for "Professional" cloud sync features to enable remote backup and multi-device management.
*   **Explicit Consent**: Synchronization only occurs if specifically activated.
*   **Separate Governance**: Cloud features are governed by the privacy terms of the connected web dashboard.

## 3. Global Compliance
Suri achieves compliance with international standards through **Privacy by Design**.
*   **[GDPR](https://gdpr.eu/what-is-gdpr/) (Europe)**: No personal data is processed centrally or monitored without consent.
*   **[CCPA](https://oag.ca.gov/privacy/ccpa) (California)**: Users retain absolute ownership and immediate deletion rights.
*   **[Data Privacy Act of 2012](https://privacy.gov.ph/data-privacy-act/) (Philippines)**: Fully compliant with local mandates for secure data handling.

The program will not transfer any information to other networked systems unless specifically requested by the user or the operator.

## 4. RAM-Only Processing
Video feeds run through Transient RAM.

The system analyzes frames in volatile memory and deletes them milliseconds later. No video footage ever touches the hard drive.

## 5. Open Source
Suri is open source under the [AGPL-3.0 License](../LICENSE.txt).

Anyone can read the code. From the face detection logic to the database writes, the entire process is visible. No black boxes.

## Recommended Security
For maximum safety:
1.  **Encrypt the Disk**: Use [BitLocker](https://learn.microsoft.com/en-us/windows/security/operating-system-security/data-protection/bitlocker/bitlocker-overview) (Windows) or [FileVault](https://support.apple.com/en-us/HT204837) (macOS).
2.  **Lock the Kiosk**: Keep the physical machine secure.
