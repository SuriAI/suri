# Architecture

Facenox is a desktop-first system. Recognition, attendance, and biometric storage run on the local machine.

## Deployment Model

- Primary runtime: desktop app
- Primary database: local SQLite
- Network requirement for core attendance: none
- Biometric processing: local only
- Optional remote integration: separate Facenox Management Dashboard deployment for reporting and device management

## High-Level Components

```mermaid
graph TD
    subgraph Desktop["Facenox Desktop"]
        UI["React renderer"]
        MAIN["Electron main process"]
        API["Local FastAPI backend"]
        DB[("SQLite")]

        UI <-->|IPC| MAIN
        UI <-->|HTTP / multipart| API
        MAIN <-->|Lifecycle / orchestration| API
        API <--> DB
    end

    CLOUD["Optional Facenox Management Dashboard"]

    MAIN -. pairing, sync control .-> CLOUD
```

## Desktop Responsibilities

### React renderer

- camera and attendance UI
- member and group management
- settings, reports, and backup flows
- Management Dashboard Beta configuration UI

### Electron main process

- app lifecycle
- backend startup and health monitoring
- local settings persistence
- update checks
- Management Dashboard Beta pairing and sync orchestration

### Local FastAPI backend

- face detection and recognition endpoints
- anti-spoofing and attendance APIs
- export and import endpoints for backups and Remote Sync
- local database access

### Local SQLite database

- groups and members
- attendance records and sessions
- consent metadata
- encrypted biometric templates
- audit and settings data

## Data Flow

### Desktop-only flow

1. The renderer captures camera frames and attendance input.
2. The renderer sends binary image data to the local FastAPI backend.
3. The backend runs detection, anti-spoofing, and recognition locally.
4. The backend writes results to the local SQLite database.

This path does not require internet access.

### Management Dashboard Beta flow

1. An admin generates a pairing code in Facenox Management Dashboard.
2. The desktop app stores the Remote Sync URL and redeems the pairing code.
3. The desktop receives an organization ID, site ID, device ID, and device token.
4. The desktop exports a local attendance snapshot.
5. The Electron sync manager wraps that export in a Remote Sync envelope and sends it to `POST /api/sync/push`.
6. After a successful push, the sync manager automatically pulls metadata (groups and members) from `GET /api/sync/pull` and imports them locally via `POST /attendance/import-metadata`.

The desktop remains the system of record for biometrics and local attendance capture.

When paired with a Dashboard, roster (groups and members) authority shifts to the Dashboard. Desktop roster mutations are blocked by the backend (HTTP 403). Groups and members flow one way: Dashboard → Desktop via pull. Attendance records and sessions are pushed Desktop → Dashboard.

## Desktop and Remote Sync Boundary

The Remote Sync boundary is intentionally narrow.

### Data that stays local

- raw face images
- biometric templates and embeddings
- local face matching
- local enrollment workflow

### Data that may be sent to Facenox Management Dashboard

- organization, site, and device identifiers
- attendance records and sessions
- sync status and device health metadata

Groups and members are not sent to Dashboard. They are pulled from Dashboard to Desktop via `import-metadata` after each push.

## Sync Model

The current sync design is intentionally simple.

- push-then-pull: desktop pushes attendance snapshots, then pulls groups and members metadata from dashboard
- snapshot-based push with real-time event stream: attendance data is pushed as full snapshots; the desktop also maintains an SSE connection (`/api/sync/events`) for real-time sync triggers (`POLICY_UPDATE`, `ROSTER_UPDATE`, `SYNC_REQUEST`)
- roster flow is one-way: Dashboard → Desktop. After each push, `import-metadata` upserts incoming groups/members and prunes any local group or member with a `remote_id` that no longer exists in the pull response
- when paired, Desktop roster mutations are blocked by the local backend (HTTP 403). The Dashboard UI hides roster mutation buttons when connected
- auto-sync available in the desktop app
- manual `Sync Now` available as an override
- initial sync runs immediately after pairing
- catch-up sync runs on startup when the device is overdue

If Remote Sync fails, local attendance continues.

## Not in This Repository

This repository does not implement:

- Remote-side biometric storage
- Remote-side face matching
- two-way sync for members or attendance edits (roster is intentionally one-way: Dashboard → Desktop)
- payroll or HRIS integrations
- mobile clients

Those concerns belong to a separate Remote Sync architecture and should be documented there directly.
