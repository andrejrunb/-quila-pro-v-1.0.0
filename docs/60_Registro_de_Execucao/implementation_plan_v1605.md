# Implementation Plan v1605 — Governance & Passive AI

This plan focuses on enhancing the system's ability to handle incidents through professional governance (audit/treatment) and adding passive safety analytics (fall detection), fulfilling Trilha 3 of the roadmap.

## Proposed Changes

---

### [AI Engine]
Enhancing passive safety analytics by expanding existing behavioral logic.

#### [MODIFY] [behavior_engine.py](file:///c:/aquila/aquilapro_electron/python/behavior_engine.py)
- Expand `analyze` to handle `anon_id` for unrecognized subjects.
- Refine `falling` detection heuristic: Increase precision by monitoring aspect ratio changes (Width vs Height) in addition to vertical velocity.
- Emit a temporary flag for behavior state change to avoid duplicate events.

#### [MODIFY] [camera_worker.py](file:///c:/aquila/aquilapro_electron/python/camera_worker.py)
- Route all bounding boxes (even those without face IDs) through `behavior_engine.analyze`.
- Emit `fall_detected` event when the engine returns the `falling` behavior.

---

### [Data & Governance]
Adding formal treatment workflows and auditing for security incidents.

#### [MODIFY] [Database.ts](file:///c:/aquila/aquilapro_electron/src/database/Database.ts)
- Add columns to `notifications` table: `treatedAt` (DATETIME), `treatedBy` (TEXT), `treatmentNotes` (TEXT).
- Implement `treatIncident(id, userId, notes)` method.

#### [NEW] [AuditService.ts](file:///c:/aquila/aquilapro_electron/src/services/AuditService.ts)
- Wrapper for `Database.audit_logs`.
- Method `logAction(userId, action, reason, metadata)`.
- Ensure all "Treat Incident" actions are audited.

---

### [Evidence Management]
Persisting visual evidence for legal and operational review.

#### [NEW] [EvidenceArchiver.ts](file:///c:/aquila/aquilapro_electron/src/services/EvidenceArchiver.ts)
- Service to save base64 frames to `userData/Evidence/` folder.
- Link notification ID to the local filename for retrieval.

---

### [UI / Incident Command]
Professionalizing the incident response workflow.

#### [NEW] [IncidentResponseModal.tsx](file:///c:/aquila/aquilapro_electron/src/ui/modals/IncidentResponseModal.tsx)
- Modal window for treating an incident.
- Inputs for "Treatment Notes" and "Resolution Status".
- Display the archived high-res evidence image.

#### [MODIFY] [UnifiedCommand.tsx](file:///c:/aquila/aquilapro_electron/src/ui/pages/UnifiedCommand.tsx)
- Integrate the response modal.
- Connect "Treat Alert" action to the modal.

---

## Verification Plan

### Automated Tests
- **Fall Simulation**: Unit test `fall_detector.py` with mock coordinate sequences (Standing -> Mid-Fall -> Grounded).
- **Audit Integrity**: Verify that `Database.treatIncident` correctly inserts a row into `audit_logs`.

### Manual Verification
- **Incident Loop**: Trigger a simulated alert, open the `IncidentResponseModal`, add notes, and verify the incident disappears from "Open Alerts" and appears in the `AuditLogViewer`.
- **Evidence Check**: Verify that a PNG file is created in the `Evidence` folder when an alert is triggered.
