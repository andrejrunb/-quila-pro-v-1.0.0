# Multi-Year Evolutionary Memory (v1640)

Scaling the student portfolio from a "Snaphot" to an **"Academic Lifecycle"**. This phase implements long-term data persistence and evolutionary analysis across multiple years of enrollment.

## User Review Required

> [!IMPORTANT]
> This architecture requires **Historical Data Migration** logic for students who have been in the school for many years. Initial implementation will focus on the data structure for continuous growth.

## Proposed Changes

### [Evolutionary Analytics Layer]

#### [NEW] [EvolutionaryTimelineService.ts](file:///c:/aquila/aquilapro_electron/src/services/EvolutionaryTimelineService.ts)
- Aggregates multi-year KPIs (Behavior, Grades, Attendance).
- Provides `getStudentLifecycle(studentId)` for historical reconstruction.

### [Agentic Brain Upgrades]

#### [MODIFY] [agents/StudentAgent.ts](file:///c:/aquila/aquilapro_electron/src/services/agents/StudentAgent.ts)
- Add "Legacy Recall" sub-agents to compare current week with the same week 1 year ago.

#### [MODIFY] [agents/CoordinatorAgent.ts](file:///c:/aquila/aquilapro_electron/src/services/agents/CoordinatorAgent.ts)
- Implement "Multi-Year Benchmarking" for institutional retention reports.

### [Visual Evidence]

#### [NEW] [EvolutionaryDashboard.tsx](file:///c:/aquila/aquilapro_electron/src/ui/components/EvolutionaryDashboard.tsx)
- Interactive timeline showing growth spurts and behavioral shifts over the years.
- Integration: Add to `ParentPortal` and `CoordinationManagement`.

## Verification Plan

### Automated Tests
- `npm test src/services/EvolutionaryTimelineService`
- Validate that the data aggregation logic correctly skips years with no enrollment.

### Manual Verification
- Simulate 3 years of data for a mock student and verify the timeline rendering.
