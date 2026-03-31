# Self-Healing Infrastructure & Bio-Safety (v2241)

The first phase of the final 400 steps, focusing on institutional resilience and cognitive environmental health.

## User Review Required

> [!NOTE]
> This phase requires IoT sensor data for CO2 and humidity. We will implement the digital twin logic (simulated service) to consume this telemetry.

## Proposed Changes

### [Resilience Layer]

#### [NEW] [SelfHealingInnoService.ts](file:///c:/aquila/aquilapro_electron/src/services/SelfHealingInnoService.ts)
- Monitors NVR/VMS/Agent health signals.
- Performs "Soft Reboot" and "Traffic Rerouting" if a node latency exceeds 500ms.
- Predicts storage failure based on I/O throughput anomalies.

### [Bio-Safety Layer]

#### [NEW] [EnvironmentIntelligenceService.ts](file:///c:/aquila/aquilapro_electron/src/services/EnvironmentIntelligenceService.ts)
- Aggregates CO2, Humidity, and PM2.5 data.
- Alerts `TeacherAgent` if CO2 exceeds 1000ppm (Cognitive decline threshold).
- Provides "Optimal Learning Window" predictions.

### [Agentic Upgrades]

#### [NEW] [InfrastructureAgent.ts](file:///c:/aquila/aquilapro_electron/src/services/agents/InfrastructureAgent.ts)
- New Hub Agent to manage the school's physical and digital skeleton.
- Registers in `AgentOrchestratorService`.

## Verification Plan

### Automated Tests
- `npm test src/services/SelfHealingInnoService`
- Simulate a hardware failure and verify the rerouting log.

### Manual Verification
- View `InfrastructureHealth` component and verify "Air Quality" metrics are active.
