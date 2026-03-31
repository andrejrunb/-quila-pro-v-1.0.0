# Autonomous Institutional Legacy Sync (v2941)

Bridging the gap between 20 years of legacy records and the Áquila Pro 'School OS' through autonomous, high-integrity synchronization.

## Proposed Changes

### [Legacy Layer]

#### [NEW] [LegacySovereigntyBridge.ts](file:///c:/aquila/aquilapro_electron/src/services/LegacySovereigntyBridge.ts)
- High-integrity parser for legacy SIS exports (Urania, SIESCOLA).
- Logic: "Conflict Resolution" (identifying discrepancies between physical attendance and legacy enrollment).
- Implement `SHA-256` verification for all imported legacy blocks.

### [Agentic Upgrades]

#### [MODIFY] [AcademicRecordsService.ts](file:///c:/aquila/aquilapro_electron/src/services/AcademicRecordsService.ts)
- Add "Historical Reconciliation" logic.
- Interface with `LegacySovereigntyBridge` to flag "Ghost Records".

#### [MODIFY] [agents/AdminAgent.ts](file:///c:/aquila/aquilapro_electron/src/services/agents/AdminAgent.ts)
- Add `LegacySquad` spawning for batch historical updates.

## Verification Plan

### Automated Tests
- `npm test src/services/LegacySovereigntyBridge`
- Verify that a record with a mismatched birth date between legacy and Áquila triggers a `DATA_DISCREPANCY` alert.

### Manual Verification
- Upload a mock legacy CSV to the `IntegrationHUB` and verify if the `AdminAgent` logs a "Legacy Sync - Integrity Verified" event.
