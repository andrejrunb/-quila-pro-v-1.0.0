# Affective & Re-ID Persistence (v1941)

This phase implements the first 100 steps of Block 2, focusing on emotional intelligence and identity continuity.

## User Review Required

> [!NOTE]
> This phase leverages the existing `MicroExpressionService`. No new cameras are required; it uses existing infrastructure for high-resolution desk-level feeds.

## Proposed Changes

### [Affective Intelligence Layer]

#### [NEW] [AffectiveAnalyticsService.ts](file:///c:/aquila/aquilapro_electron/src/services/AffectiveAnalyticsService.ts)
- Aggregates data from `MicroExpressionService`.
- Calculates `EMOTIONAL_VALENCE` (Positive/Negative) and `AROUSAL` (Energy levels).
- Provides `getClassroomAtmosphere()` for coordinators.

### [Persistence Layer]

#### [NEW] [ReIDPersistenceService.ts](file:///c:/aquila/aquilapro_electron/src/services/ReIDPersistenceService.ts)
- Implements gait-based tracking signatures.
- Maintains a "Persistent Subject ID" when a student leaves a facial-rec zone and enters a low-res hallway.

### [Agentic Upgrades]

#### [MODIFY] [agents/StudentAgent.ts](file:///c:/aquila/aquilapro_electron/src/services/agents/StudentAgent.ts)
- `MotivationBot` now consumes `AffectiveAnalytics` to detect "Frustration Spikes".

#### [MODIFY] [agents/SecurityAgent.ts](file:///c:/aquila/aquilapro_electron/src/services/agents/SecurityAgent.ts)
- `PerimeterWatchdog` now uses Re-ID signatures to track moving objects across distinct NVR clusters.

## Verification Plan

### Automated Tests
- `npm test src/services/AffectiveAnalyticsService`
- Verify Re-ID signature consistency across two simulated camera feeds.

### Manual Verification
- View `EngagementRadar` and verify "Sentiment Pulse" updates when micro-expression data is injected.
