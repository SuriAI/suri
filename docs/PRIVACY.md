# Data & Privacy
Suri is a local-only tool. Data stays on your hardware. Compliant with [DPA 2012](https://privacy.gov.ph/data-privacy-act/), [GDPR](https://gdpr.eu/what-is-gdpr/), and [CCPA](https://oag.ca.gov/privacy/ccpa) by design.

## 1. Zero-Image Storage
**Face images are never stored.**
- Faces are converted to mathematical embeddings.
- Original images are discarded immediately after processing.
- Embeddings cannot be reversed to recreate a face.

## 2. Zero-Knowledge Vaults (.suri)
- **Encryption**: AES-256-GCM.
- **Key Derivation**: PBKDF2-HMAC-SHA256 (480,000 iterations).
- **Architecture**: Zero-knowledge. Decryption keys never leave the device.
- **No Recovery**: Lost passwords result in permanent data loss.

## 3. Data Sovereignty
- **Offline First**: Works 100% offline. Data never leaves your device unless explicitly exported.
- **No Telemetry**: No usage metrics or "phone home" signals.
- **Open Source**: Licensed under AGPL-3.0 for transparency and auditability.

## 4. Suri Cloud (Optional)
- **E2EE Sync**: Biometric data is encrypted locally before sync.
- **Remote Analytics**: Dashboard shows metadata/reports only. Zero biometric exposure.
- **Auto-Backup**: Automated cloud storage for system state.

## 5. Recommended Security
- **Windows**: Enable BitLocker.
- **macOS**: Enable FileVault.
