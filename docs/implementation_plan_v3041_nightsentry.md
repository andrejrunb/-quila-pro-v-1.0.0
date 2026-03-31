# Autonomous Night Sentry & Event Protocols (v3041)

Replacing third-party "Night Monitoring" services with a self-sufficient, AI-driven sentry system that adapts to the school's schedule.

## Proposed Changes

### [Security Layer]

#### [NEW] [NightSentryService.ts](file:///c:/aquila/aquilapro_electron/src/services/NightSentryService.ts)
- Specialized monitoring for empty buildings.
- Logic: "Perimeter Tripwire" (RuView signature detection at gates/windows).
- "Acoustic Sentry": Detection of breaking glass or unauthorized voices using the infrastructure's audio nodes.
- Direct Bridge to Local Authorities (Mock logic) for verified breaches.

### [Agentic Consciousness]

#### [MODIFY] [agents/SecurityAgent.ts](file:///c:/aquila/aquilapro_electron/src/services/agents/SecurityAgent.ts)
- Add `SecurityProtocol` state: `ACADEMIC_DAY`, `NIGHT_SENTRY`, `EVENT_PROTOCOL`.
- `NIGHT_SENTRY`: 10x sensitivity on perimeter, silent alarms enabled.
- `EVENT_PROTOCOL`: Whitelist-only geofensing for specific hallways; high-alert on restricted zones (Server room, Lab).

### [UI / Dashboard]

#### [MODIFY] [pages/GlobalEcosystem.tsx](file:///c:/aquila/aquilapro_electron/src/ui/pages/GlobalEcosystem.tsx)
- Add "Institutional Guard Status" widget.
- Visual toggle for "Event Mode" (overriding the autonomous clock).

## Verification Plan

### Automated Tests
- `npm test src/services/NightSentryService`
- Verify that a RUVIEW signature at a "Window" zone during `NIGHT_SENTRY` triggers a `POLICE_BRIDGE_ALERT`.

### Manual Verification
- Toggle "Event Mode" in the dashboard and verify if `SecurityAgent` logs "Protocol Updated: Event Mode Active. Whitelisting Public Hallway."
