# Super-Sprint 300: Institutional Intelligence (v1642–v1940)

Executing the first major block (300 steps) of the Áquila OS expansion. This super-sprint delivers the core predictive engines for all three squads.

## User Review Required

> [!IMPORTANT]
> This is a high-density update affecting 3 squads simultaneously. 

## Proposed Changes

### [Squad 1: Segurança Preditiva (v1642)]
#### [MODIFY] [PredictiveSafetyService.ts](file:///c:/aquila/aquilapro_electron/src/services/PredictiveSafetyService.ts)
- Add `ANOMALY_SOCIAL_ISOLATION` detection logic.
- Add `ANOMALY_LATE_STAY` (detecting students in school after hours).

### [Squad 2: Evolução Pedagógica (v1643-v1645)]
#### [NEW] [EducationalEngagementService.ts](file:///c:/aquila/aquilapro_electron/src/services/EducationalEngagementService.ts)
- Tracks "Academic Pulse": Engagement velocity over time.
#### [NEW] [InterestsMappingService.ts](file:///c:/aquila/aquilapro_electron/src/services/InterestsMappingService.ts)
- Catalogs student hobbies and affinities from internal assignments.
#### [MODIFY] [agents/StudentAgent.ts](file:///c:/aquila/aquilapro_electron/src/services/agents/StudentAgent.ts)
- Implement `MotivationBot` sub-agent for daily engagement check.

### [Squad 3: Sincronização Operacional (v1646-v1650)]
#### [NEW] [GeofencingArrivalService.ts](file:///c:/aquila/aquilapro_electron/src/services/GeofencingArrivalService.ts)
- Notifies the `ArrivalAgent` when a parent is within 500m of the school.
#### [MODIFY] [agents/ArrivalAgent.ts](file:///c:/aquila/aquilapro_electron/src/services/agents/ArrivalAgent.ts)
- Implement `ArrivalOrganizerBot` to queue student exit sequences.

### [UI: Unified Command 2.0]
#### [NEW] [EngagementRadar.tsx](file:///c:/aquila/aquilapro_electron/src/ui/components/EngagementRadar.tsx)
- Visual radar showing class-wide pedagogical motivation.

## Verification Plan

### Automated Tests
- `npm test src/services/EducationalEngagementService`
- `npm test src/services/GeofencingArrivalService`

### Manual Verification
- Simulate a parent "Entering Geofence" and verify the `ArrivalAgent` queue update.
- Verify the "Motivation Radar" displays correct sentiment data.
