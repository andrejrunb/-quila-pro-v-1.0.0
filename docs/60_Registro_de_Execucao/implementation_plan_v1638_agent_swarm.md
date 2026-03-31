# Hierarchical Swarm: Hub-Spawning Architecture (v1638)

Advancing the Áquila Swarm to a **Hierarchical Mode**. Each primary agent (Hub) now has the capability to assemble and manage dynamic teams of up to 10 specialized sub-agents.

## User Review Required

> [!IMPORTANT]
> This introduces **Recursive Autonomy**.
> - **Hub Agents**: The 9 primary APK/Role entities.
> - **Sub-Agent Squads**: Task-specific entities spawned by Hubs (e.g., `FaceMatchBot`, `NotificationBot`).

## Proposed Changes

### [Core Hierarchical Architecture]

#### [MODIFY] [AutonomousAgent.ts](file:///c:/aquila/aquilapro_electron/src/services/AutonomousAgent.ts)
- Add `spawnSubTeam(taskType: string): void` method.
- Add `subAgents: Map<string, SubAgent>` registry.
- Hubs now act as managers for their spawned teams.

#### [NEW] [SubAgent.ts](file:///c:/aquila/aquilapro_electron/src/services/SubAgent.ts)
- Lightweight interface/class for task-specific logic units.
- Max 10 per Hub instance per task.

### [Example: Security Hub Spawning Squads]
- **Task: PERIMETER_BREACH** -> Spawns `CameraSweepBot`, `BiometricVerifier`, `StaffNotifier`.
- **Task: SYSTEM_AUDIT (Strix)** -> Spawns `PortScannerBot`, `DependencyAuditor`, `LogIntegrityBot`.

### [Example: Pedagogy Hub Spawning Squads]
- **Task: ACADEMIC_RISK** -> Spawns `HistoricalTrendBot`, `EngagementAnalyzer`, `ParentAlertGenerator`.

### [Orchestration Layer]

#### [MODIFY] [AgentOrchestratorService.ts](file:///c:/aquila/aquilapro_electron/src/services/AgentOrchestratorService.ts)
- Support recursive task routing (Targeting specific Hub -> Team -> SubAgent).

## Verification Plan

### Automated Tests
- Validate Hub-to-SubAgent task delegation.
- Check "Max 10" constraint implementation.

### Manual Verification
- Monitor the `AgentActivityFeed` for "Squad-level" logs and task handoffs.
