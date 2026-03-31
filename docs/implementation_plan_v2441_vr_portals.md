# VR Immersive Portals & Digital Twin (v2441)

Transitioning the school management from 2D dashboards to a real-time, immersive 3D Digital Twin environment.

## Proposed Changes

### [Immersive Layer]

#### [NEW] [VRPortalService.ts](file:///c:/aquila/aquilapro_electron/src/services/VRPortalService.ts)
- Manages Three.js / WebXR session lifecycle.
- Syncs `DigitalTwin` state with the immersive headset/browser.
- Handles "Teleport-to-Incident" logic for the Security Hub.

### [Visualization Layer]

#### [NEW] [DigitalTwinHub.tsx](file:///c:/aquila/aquilapro_electron/src/ui/pages/DigitalTwinHub.tsx)
- Replaces `UnifiedCommand` 2D map with a 3D floor plan.
- Real-time subject position markers (RuView Signal + FaceID centroids).
- Integrated thermal/CO2 heatmaps.

### [Agentic Upgrades]

#### [MODIFY] [agents/SecurityAgent.ts](file:///c:/aquila/aquilapro_electron/src/services/agents/SecurityAgent.ts)
- Add "Bioculometrics" analysis (simulated eye-tracking patterns).
- Integrate with `VRPortalService` for automated patrol dispatch.

## Verification Plan

### Automated Tests
- `npm test src/services/VRPortalService`
- Verify 3D coordinate mapping from CSI WiFi signals.

### Manual Verification
- Render the `DigitalTwinHub` and verify subject "shadows" move in real-time.
