# Implementation Plan - Production Stabilization & Role-Based UI (v1603)

This plan addresses a critical production build error, removes notification spam, and organizes the dashboard UI according to user roles.

## User Review Required

> [!IMPORTANT]
> Some advanced hardware and security features (Hardware Hub, Security Vision, etc.) will be restricted to users with the `admin` role after this update. If teachers or coordinators need access to these, their roles must be updated in the User Management section.

## Proposed Changes

### 1. Fix Renderer Node.js Module Leaks (`require is not defined`)

We will decouple UI components from services that import Node.js modules (like `events`).

#### [NEW] [AiTypes.ts](file:///c:/aquila/aquilapro_electron/src/services/AiTypes.ts)
- Create a pure-type file for `SecurityEvent` and `SecurityEventType` to allow safe imports in the renderer.

#### [MODIFY] [AiAnalysisService.ts](file:///c:/aquila/aquilapro_electron/src/services/AiAnalysisService.ts)
- Import types from `AiTypes.ts`.
- Ensure it remains as a main-process service only (though it was being pulled into the UI).

#### [MODIFY] [SecurityAlertCard.tsx](file:///c:/aquila/aquilapro_electron/src/ui/components/SecurityAlertCard.tsx)
- Import types from `AiTypes.ts` instead of `AiAnalysisService.ts`.

#### [MODIFY] [IoTService.ts](file:///c:/aquila/aquilapro_electron/src/services/IoTService.ts)
- Remove `EventEmitter` from `events`.
- Use a browser-safe implementation or move the event handling to the component level using `window.aquila.on`.

---

### 2. Fix "Aluno Atrasado" Notification Spam

#### [MODIFY] [Database.ts](file:///c:/aquila/aquilapro_electron/src/database/Database.ts)
- Replace placeholder in `getLateStudents` with real SQL logic based on student schedules and current time.
- Add a check to prevent duplicate notifications for the same student on the same day.

#### [MODIFY] [NotificationManager.ts](file:///c:/aquila/aquilapro_electron/src/services/NotificationManager.ts)
- Refine the polling interval and ensure `arrivalTime` is correctly formatted in messages.

---

### 3. UI Organization & Role-Based Filtering

#### [MODIFY] [Sidebar.tsx](file:///c:/aquila/aquilapro_electron/src/ui/components/Sidebar.tsx)
- Implement role-based filtering for the `menuItems` list.
- **Admin only**: Hardware Hub, Security Vision, LGPD, Settings.
- **Director/Secretary**: Coordination, Reports, Students, Attendance.
- **Teacher**: Portal Professor, Diary, Attendance.

#### [MODIFY] [App.tsx](file:///c:/aquila/aquilapro_electron/src/App.tsx)
- Standardize all IPC calls to use `(window as any).aquila.invoke`.
- Ensure `ProtectedRoute` is applied consistently.

## Verification Plan

### Automated Tests
- Run `npm run build` to verify that the renderer bundle no longer contains `require` calls.
- Execute a script to simulate student late entry and verify exactly one notification is generated.

### Manual Verification
- Log in as a `teacher` and verify that the "Hardware Hub" and "Câmeras" options are hidden from the sidebar.
- Open the "Alerta de Segurança" card and verify it renders without crashing.
- Verify that the "Aluno Atrasado" spam has stopped on the dashboard.
