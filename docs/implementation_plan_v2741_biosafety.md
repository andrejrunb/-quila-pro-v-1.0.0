# Bio-Safety & Environmental Intelligence (v2741)

Evolving the school's "Lungs" (HVAC/Environment) into an autonomous, self-correcting system to ensure 100% cognitive safety for students.

## Proposed Changes

### [Safety Layer]

#### [NEW] [BioSafetyAutomator.ts](file:///c:/aquila/aquilapro_electron/src/services/BioSafetyAutomator.ts)
- Connects `EnvironmentIntelligenceService` thresholds with `InfrastructureAgent` actuators.
- Logic: `CO2 > 800ppm` -> Warn Assistant; `CO2 > 1200ppm` -> Trigger HVAC High-Flow (Simulation).
- Implements "Adaptive Comfort" based on local PM2.5 and humidity.

### [Agentic Upgrades]

#### [MODIFY] [agents/InfrastructureAgent.ts](file:///c:/aquila/aquilapro_electron/src/services/agents/InfrastructureAgent.ts)
- Add `EnvironmentSquad` spawning for autonomous climate balancing.
- Integrate with `BioSafetyAutomator` for feedback loops.

### [UI Fixes]

#### [MODIFY] [pages/GlobalEcosystem.tsx](file:///c:/aquila/aquilapro_electron/src/ui/pages/GlobalEcosystem.tsx)
- [FIX] Correct `agentOrchestratorService` method call for context retrieval (resolving Step 7051 error).

## Verification Plan

### Automated Tests
- `npm test src/services/BioSafetyAutomator`
- Verify that `CO2` spikes trigger the correct actuator signal in the logs.

### Manual Verification
- Manually edit the CO2 value in the `InfrastructureHealth` dashboard and verify if a "HVAC VENTILATION ACTIVE" alert appears on the `GlobalEcosystem` feed.
