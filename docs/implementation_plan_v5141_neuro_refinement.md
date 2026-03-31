# Neuro-Feedback Dashboard Refinement (v5141)

Elevating the teacher's 'Command Center' with advanced neuro-telemetry and premium aesthetics.

## Proposed Changes

### [UI / Visualization]

#### [MODIFY] [pages/TeacherDashboard.tsx](file:///c:/aquila/aquilapro_electron/src/ui/pages/TeacherDashboard.tsx)
- **Classroom Neuro-Map**: A grid representing the physical classroom with 'Focus Bubbles' that pulse based on individual student engagement.
- **Cognitive Trend Chart**: A lightweight SVG sparkline showing focus/fatigue trends over the last 30 minutes.
- **Micro-Animation Sync**: Sync the `Neuro-Pulse` animation frequency with the actual focus score.

#### [NEW] [pages/NeuroDashboard.css](file:///c:/aquila/aquilapro_electron/src/ui/pages/NeuroDashboard.css)
- Advanced keyframe animations for 'Neuro-Pulses'.
- Glassmorphism refinements and gradient-shadow effects for high-intensity alerts.

### [Intelligence Layer]

#### [MODIFY] [services/NeuroPedagogyService.ts](file:///c:/aquila/aquilapro_electron/src/services/NeuroPedagogyService.ts)
- Implement `getHistoricalNeuroTrends` to provide data for the sparklines.
- Simulate "Individual Focus Clusters" for the classroom map.

## Verification Plan

### Automated Tests
- `npm test src/services/NeuroPedagogyService`
- Verify that `getHistoricalNeuroTrends` returns exactly 30 data points.

### Manual Verification
- Open the `TeacherDashboard` and verify that the "Neuro-Map bubbles" change size and color in real-time.
- Confirm that the 'Trend Chart' renders correctly as an SVG path.
