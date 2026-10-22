# Governance & Hardware Telemetry Walkthrough

This walkthrough details the integration of active governance controls and real-time hardware monitoring into the Áquila Pro operational dashboards.

## Key Enhancements

### 1. Active Governance & Audit Trail
- **AuditLogService Integration**: All administrative interventions are now recorded in a centralized, compliant audit log.
- **Audited Handlers**: 
    - `pedagogical:dismiss-risk`: Now requires a justification, logs the user, student, and reason.
    - `pedagogical:share-with-parents`: Logs when an AI insight is authorized for external distribution.
- **Intervention UI**: Added "Dismiss" and "Share" buttons to the dashboards, bridging frontend actions directly to the audited backend services.

### 2. Neural Hardware Monitoring (NPU)
- **Live Telemetry**: Integrated `NpuOptimizationService` metrics into the main dashboard.
- **Performance Visibility**: Administrators can now monitor:
    - **NPU Temperature**: Ensuring compliance with the 75°C threshold.
    - **Health Score**: Real-time status of the neural engine.
    - **Workload Factor**: Current load on the hardware acceleration layer.

### 3. AI-Driven Coordination Radar
- **Live Trend Synthesis**: Replaced static insights with real-time analysis from the `SovereignLibrarianService`'s IA motor.
- **Evasion Radar Actions**: The Coordination Dashboard now allows direct dismissal of pedagogical risks, which triggers an immediate recovery cycle for student metrics.

## Technical Details

### IPC Bridge Updates
- `system:get-hardware-telemetry`: New channel for hardware health.
- `system:get-recent-alerts`: Enriched with `studentId` and `riskType` for granular control.

### UI Components Modified
- `AdvancedDashboard.tsx`: Added hardware panel and alert dismissal logic.
- `CoordinationDashboard.tsx`: Integrated live insights and radar interventions.

## Verification
![Governance Intervention](file:///c:/aquila/apps/electron/assets/gov_intervention.png)
*Note: Justification prompts now enforce an audit trail for every risk dismissal.*
