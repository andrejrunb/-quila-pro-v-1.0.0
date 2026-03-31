# Implementation Plan v1604 — Strategic Enhancements (AI & Notifications)

This plan outlines the strategic upgrade of Áquila Pro to an enterprise-grade security platform, focusing on high-precision AI detection and a scalable notification architecture.

## Proposed Changes

---

### [AI Engine]
Enhancing the Python detection worker to improve precision and performance.

#### [MODIFY] [weapon_detector.py](file:///c:/aquila/aquilapro_electron/python/weapon_detector.py)
- Refactor NMS (Non-Maximum Suppression) to use `cv2.dnn.NMSBoxes` for professional-grade overlapping box filtering.
- Implement dynamic `confidence_threshold` via constructor and potential IPC update.
- Improve coordinate scaling to handle various input frame sizes (e.g., 1080p downscaling).

---

### [Notification Infrastructure]
Architecting a unified gateway to support multiple providers (Meta, Evolution API, Discord, etc.) and improve reliability.

#### [NEW] [NotificationGateway.ts](file:///c:/aquila/aquilapro_electron/src/services/NotificationGateway.ts)
- Abstract interface `INotificationProvider`.
- Implementation of `WhatsAppProvider` (Meta API).
- Implementation of `MockProvider` for simulation.
- Centralized `sendNotification` method with priority routing.

#### [MODIFY] [WhatsAppQueue.ts](file:///c:/aquila/aquilapro_electron/src/services/WhatsAppQueue.ts)
- Refactor to delegate the actual sending logic to the `NotificationGateway`.
- Maintain rate-limiting and persistence logic.

---

### [Observability & Metrics]
Adding system health monitoring to ensure high-uptime security operations.

#### [NEW] [MetricsService.ts](file:///c:/aquila/aquilapro_electron/src/services/MetricsService.ts)
- Singleton service to track:
  - `detections_total`: Count of weapon/object detections.
  - `notifications_sent_total`: Count of successful/failed alerts.
  - `system_fps`: Real-time processing speed from the worker.
  - `latency_ms`: Time from detection to notification.

---

### [Dashboard UI]
Visualizing the new intelligence and incident historical data.

#### [NEW] [IncidentTimeline.tsx](file:///c:/aquila/aquilapro_electron/src/ui/components/IncidentTimeline.tsx)
- Vertical timeline component showing recent security events with high-resolution thumbnails.
- Inspired by enterprise SOC tools like TheHive.

#### [MODIFY] [Dashboard.tsx](file:///c:/aquila/aquilapro_electron/src/ui/pages/Dashboard.tsx)
- Integrate the `IncidentTimeline` and a "System Health" mini-widget.

---

## Verification Plan

### Automated Tests
- **AI Simulation**: Run `python weapon_detector.py` with representative frames to verify NMS box filtering.
- **Gateway Unit Test**: Use a mock provider to verify that `NotificationGateway` correctly routes messages based on priority.

### Manual Verification
- **Visual Check**: Open the dashboard and verify the "Incident Timeline" reflects real-time entry events and simulated alerts.
- **Notification Loop**: Trigger a "Test Connection" in WhatsApp Settings and verify it correctly traverses the new Gateway.
