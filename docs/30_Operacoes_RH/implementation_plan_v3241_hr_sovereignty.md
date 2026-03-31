# Autonomous HR & Payroll Sovereignty (v3241)

Consolidating human capital management into the Áquila Pro ecosystem, replacing third-party HR and payroll platforms.

## Proposed Changes

### [HR & Payroll Layer]

#### [NEW] [HRSovereigntyService.ts](file:///c:/aquila/aquilapro_electron/src/services/HRSovereigntyService.ts)
- Autonomous payroll engine based on staff contracts and presence data.
- **Tax Logic**: Automated Income Tax (IRRF) calculation and social security (INSS) deductions.
- **Time-Clock Bridge**: Integration with RuView for "Biometric Presence" (no manual cards needed).
- Logic for "Delay Penalties" and "Overtime Optimization".

### [Agentic Upgrades]

#### [MODIFY] [agents/AdminAgent.ts](file:///c:/aquila/aquilapro_electron/src/services/agents/AdminAgent.ts)
- Add `HRSquad` spawning for automated payday notifications and tax report generation.

### [UI / Dashboard]

#### [NEW] [components/HRPortal.tsx](file:///c:/aquila/aquilapro_electron/src/ui/components/HRPortal.tsx)
- Staff-facing dashboard for viewing payslips, tax holdings, and time-tracking history.
- Management interface for HR administrators to flag manual adjustments.

## Verification Plan

### Automated Tests
- `npm test src/services/HRSovereigntyService`
- Verify that a staff member with 2 recorded delays of 10+ minutes triggers a `PAYROLL_ADJUSTMENT` flag.
- Verify `IRRF` calculation accuracy against standard tax brackets.

### Manual Verification
- Open the `HRPortal` and verify if the `Biometric Ponto` status reflects real-time RuView presence.
