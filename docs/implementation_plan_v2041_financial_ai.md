# Financial Forecasting & ERP Intelligence (v2041)

Developing the core economic intelligence for the Operations squad (Block 2, Steps 501-600).

## User Review Required

> [!IMPORTANT]
> This module requires integration with real bank webhooks (PIX/Open Finance) in future production steps. This phase mocks the data flow.

## Proposed Changes

### [Finance Intelligence Layer]

#### [NEW] [FinancialForecastingService.ts](file:///c:/aquila/aquilapro_electron/src/services/FinancialForecastingService.ts)
- Analyzes payment history and economic trends.
- Predicts `CHURN_RISK` and `REVENUE_FORECAST` for the next 6 months.
- Automates "Inadimplência" (late payment) probability scoring.

### [Agentic Deployment]

#### [MODIFY] [agents/FinanceAgent.ts](file:///c:/aquila/aquilapro_electron/src/services/agents/FinanceAgent.ts)
- Spawn `ReconciliationBot` to perform nightly bank statement sync (mocked).
- Spawn `CollectionBot` to handle gentle payment reminders via WhatsApp integration.

### [UI: Admin Dashboard]

#### [NEW] [FinancialHealthWidget.tsx](file:///c:/aquila/aquilapro_electron/src/ui/components/FinancialHealthWidget.tsx)
- Visual chart showing projected vs. actual revenue.
- Predictive "LTV" indicator for the school owner.

## Verification Plan

### Automated Tests
- `npm test src/services/FinancialForecastingService`

### Manual Verification
- Open Admin Portal and verify the "Financial Health" widget displays projections correctly.
