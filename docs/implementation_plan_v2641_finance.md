# Financial Reconciliation & ERP Sync (v2641)

Implementing automated financial reconciliation to ensure 100% scholarship-to-maintenance balance and zero manual labor for the billing department.

## Proposed Changes

### [Finance Layer]

#### [NEW] [FinancialReconciliationService.ts](file:///c:/aquila/aquilapro_electron/src/services/FinancialReconciliationService.ts)
- Bridges PIX payment confirmation (JSON/Webhooks) with the internal Student Ledger.
- Automated "Partial Match" resolution (matching payments by CPF/Name similarity).
- Trigger for "Messenger Invoicing": Sends auto-generated vouchers via Áquila Elo v2541.

### [Integration Layer]

#### [MODIFY] [agents/SecretaryAgent.ts](file:///c:/aquila/aquilapro_electron/src/services/agents/SecretaryAgent.ts)
- Add `ReconciliationSquad` spawning logic.
- Automated "Default" (Inadimplência) alerts to parents after 5-day grace periods.

#### [MODIFY] [ui/pages/SecretaryDashboard.tsx](file:///c:/aquila/aquilapro_electron/src/ui/pages/SecretaryDashboard.tsx)
- Add "Financial Pulse" widget (Cashflow vs. Expected).

## Verification Plan

### Automated Tests
- `npm test src/services/FinancialReconciliationService`
- Mock 100 PIX payments and verify 100% ledger update accuracy.

### Manual Verification
- Simulate a payment in the `Database.ts` and verify if the `SecretaryAgent` triggers a "Thank You" message in `MessengerPortal`.
