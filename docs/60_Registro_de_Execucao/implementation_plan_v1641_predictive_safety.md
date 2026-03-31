# Predictive Safety Anomalies (v1641)

Transitioning from "Monitoring" to "Prediction". This phase implements automated anomaly detection for student safety and perimeter integrity, without physical interventions.

## User Review Required

> [!NOTE]
> This phase uses data from existing `PoseEstimationService` and `HeatmapService`. No new hardware is required.

## Proposed Changes

### [Safety Intelligence Layer]

#### [NEW] [PredictiveSafetyService.ts](file:///c:/aquila/aquilapro_electron/src/services/PredictiveSafetyService.ts)
- Analyzes population density and individual trajectory.
- Detects `ANOMALY_RUNNING`, `ANOMALY_ISOLATION`, and `ANOMALY_CROWDING`.
- Provides `getCurrentRiskLevel()` for UI feedback.

### [Agentic Deployment]

#### [MODIFY] [agents/SecurityAgent.ts](file:///c:/aquila/aquilapro_electron/src/services/agents/SecurityAgent.ts)
- Implement `SafetyAnomalyBot` sub-agent spawning.
- Automate report generation for "Potential Risks" to the Security Desk.

### [UI / Dashboard SOC]

#### [MODIFY] [components/InfrastructureHealth.tsx](file:///c:/aquila/aquilapro_electron/src/ui/components/InfrastructureHealth.tsx)
- Add "Predictive Safety Index" widget.
- Real-time pulse indicating the current environmental risk state.

## Verification Plan

### Automated Tests
- `npm test src/services/PredictiveSafetyService`
- Simulate "Erratic Movement" data and verify trigger of the `SafetyAnomalyBot`.

### Manual Verification
- Open `UnifiedCommand` and verify the risk pulse responds to simulated anomaly data.
