# Implementation Plan - v1629: Smart Exit Tracking & Behavioral Guardrails

Este plano implementa o rastreamento inteligente de trajetórias para garantir que alunos sigam o destino autorizado (ex: Banheiro) e não desviem para áreas não permitidas (ex: Cantina) durante a aula.

## Proposed Changes

### [v1629: Path Analysis & Zone Logic]
- [NEW] [LocationZoneService.ts](file:///c:/aquila/aquilapro_electron/src/services/LocationZoneService.ts): Define zonas críticas (Banheiro, Cantina, Biblioteca, Pátio).
- [MODIFY] [SafetyMonitorService.ts](file:///c:/aquila/aquilapro_electron/src/services/SafetyMonitorService.ts): 
    - Implementar `detectClassroomExit(studentId)`.
    - Iniciar `pathWatchdog` para validar se o destino final condiz com o tempo e zona esperada.
- [MODIFY] [PedagogicalReportingService.ts](file:///c:/aquila/aquilapro_electron/src/services/PedagogicalReportingService.ts): Incluir "Relatório de Desvios de Trajetória" no resumo para o professor.
- [MODIFY] [StudentPortfolioService.ts](file:///c:/aquila/aquilapro_electron/src/services/StudentPortfolioService.ts): Criar evento `ZONE_DEVIATION` que impacta negativamente o Score de Engajamento.

### [UI: Unified Command / Teacher Dash]
- [MODIFY] [TeacherDashboard.tsx](file:///c:/aquila/aquilapro_electron/src/ui/pages/TeacherDashboard.tsx): Adicionar lista de "Alunos Fora da Sala" com o status do destino (Em trânsito, No Banheiro, Desvio Detectado).

## Verification Plan
### Automated Tests
1. Simular rastro saindo da "Sala 04" e indo para "Cantina".
2. Validar se o `PedagogicalReportingService` emite alerta de "Desvio de Rota" para o Prof. Lucas.

### Manual Verification
1. Abrir o Teacher Dashboard.
2. Observar o ícone de "Alerta Crítico" quando um rastro persistir fora da zona autorizada por mais de 10 minutos.
