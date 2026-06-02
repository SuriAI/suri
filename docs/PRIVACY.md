# Privacy and Data Handling

This document covers the open source desktop application in this repository and the data boundary for the **official Facenox Dashboard**.

## Scope

This document applies to:

- the Electron desktop app in `app/`
- the local FastAPI backend in `server/`
- the current desktop-side Management Dashboard Beta integration

It does not replace the privacy and operational documentation required for a hosted Facenox Management Dashboard deployment.

## What Facenox Stores Locally

By default, the desktop app stores the following data on the local machine:

- groups and members
- attendance records and attendance sessions
- consent status and related metadata
- application settings
- audit entries
- encrypted biometric templates

The desktop app is the primary environment for biometric processing in this repository.

## Biometric Data

### What Facenox keeps

Facenox keeps biometric templates used for recognition. These templates are mathematical representations used by the local recognition pipeline.

### How biometric data is handled

Facenox is not designed as a raw face-image archive. 
- **Enrollment/Matching:** Images are processed in-memory. Only the resulting encrypted biometric template is stored.
- **Liveness Detection:** Anti-spoofing analysis happens entirely in **volatile memory (RAM)**. No photos or video frames used for liveness checks are ever written to disk.
- **Storage:** Templates are encrypted at rest using **AES-256**.

## Consent Rules

- Biometric enrollment requires consent.
- Members without active consent are excluded from biometric matching.
- Revoking consent removes the member's biometric template.
- Deleting a member removes the associated biometric template.

These controls help enforce a narrow recognition scope inside the application. They do not replace your own notices, legal basis, or retention policy.

## Backups and Restore

- Backup exports are password-protected `.facenox` files.
- Backup exports can include biometric templates so a restore does not require full re-enrollment.
- Restores still depend on the consent information present in the imported data.

If you export a backup, treat the backup file as sensitive data.

## Telemetry

The open source desktop app does not include analytics, ads, or hidden background telemetry by default.

That does not automatically make every surrounding deployment private. If you add hosting, external logs, monitoring, or third-party infrastructure, those systems need their own review.

## Official Facenox Dashboard boundary

The desktop app can optionally pair with a separate Facenox Management Dashboard deployment.

### Data NOT sent to the Facenox Dashboard

- raw face images (never leave the device)
- face matching and recognition decisions

### Data that MAY be sent (encrypted) to the Facenox Dashboard

- **encrypted biometric templates** — AES-256-GCM encrypted with your organization's key before transmission. The Dashboard stores these encrypted blobs as a blind relay for cross-device sync. Only devices in your organization can decrypt them.

### Data that MAY be sent (plaintext) to the Facenox Dashboard

- organization, site, and device identifiers
- groups and member directory data needed for reports
- attendance records and sessions
- sync status and device health metadata

The desktop app uses snapshot-based sync. Encrypted biometric templates can sync between devices in the same organization so that enrolling on one device is sufficient for all devices at that site.

## Offline Operation

The core desktop workflow remains offline-capable:

- enrollment works locally
- recognition works locally
- attendance capture works locally
- local settings and backup operations work locally

If the internet is unavailable, Management Dashboard Beta stops updating until connectivity returns, but local attendance continues.

## Security Notes

- Biometric templates are encrypted in local storage using **AES-256**.
- Backups are password-protected before they are written to disk.
- Physical device security still matters. If the machine is compromised, software controls alone are not enough.
- Full-disk encryption at the OS level is strongly recommended for real deployments.

## Compliance Position

Facenox includes controls that can support privacy-conscious deployments, but the software alone does not make a deployment compliant with GDPR, the Philippine Data Privacy Act, or any other privacy law.

Operators are still responsible for:

- notices and consent flows
- lawful basis and documentation
- retention and deletion policy
- access control
- vendor and processor management
- incident response and breach handling

## Google API Services Disclosure

Facenox uses Google API Services to streamline authentication and account management for the Management Dashboard.

### Data Accessed
When you authenticate via Google, we access your:
- Primary email address
- Full name
- Profile picture URL

We use the standard `openid`, `email`, and `profile` scopes.

### Data Usage
This data is used exclusively to:
- Create and identify your Facenox Dashboard account.
- Personalize your profile.
- Send transactional emails (e.g., password resets, organization invitations).

We do not use this data for marketing, advertising, or any other purposes.

### Data Sharing
We do not share Google user data with any third-party applications, advertisers, or other services. Your data is kept strictly within the Facenox Cloud environment.

### Data Storage & Protection
Your Google account information is stored in our secure, encrypted database (AES-256) and transmitted via secure protocols (TLS/SSL).

### Data Retention & Deletion
We retain your Google user data for as long as your account remains active. You can request the deletion of your account and all associated Google user data at any time via your dashboard or by emailing privacy@facenox.com.

---

Facenox's use and transfer to any other app of information received from Google APIs will adhere to the [Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy), including the Limited Use requirements.
