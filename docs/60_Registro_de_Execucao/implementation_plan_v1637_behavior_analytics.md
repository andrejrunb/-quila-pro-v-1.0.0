# Implementation Plan - v1637: Behavioral Analytics & Evidence Reporting

Este plano detalha a implementação de ferramentas analíticas para acompanhamento comparativo de alunos, visando dar base quantitativa à coordenação em reuniões com pais e evitar alegações de "perseguição".

## Proposed Changes

### [v1637: Analytical Logic]
- [NEW] [BehavioralAnalyticsService.ts](file:///c:/aquila/aquilapro_electron/src/services/BehavioralAnalyticsService.ts): 
    - Cálculo de médias de turma (Atrasos, Engajamento, Faltas).
    - Motor de ranking e percentis (Ex: "Top 10% mais atrasados").
    - Detecção de outliers comportamentais.

### [UI: Parent & Coordinator Portals]
- [MODIFY] [ParentPortal.tsx](file:///c:/aquila/aquilapro_electron/src/ui/pages/ParentPortal.tsx): 
    - Adicionar seção "Comparativo de Turma" com gráficos simples (Barras: Aluno vs Média).
- [NEW] [BehavioralEvidenceReport.tsx](file:///c:/aquila/aquilapro_electron/src/ui/components/BehavioralEvidenceReport.tsx): 
    - Componente de relatório exportável com dados cruzados de rádio e visão.
- [MODIFY] [CoordinatorDashboard.tsx](file:///c:/aquila/aquilapro_electron/src/ui/pages/CoordinatorDashboard.tsx): 
    - Adicionar botão "Gerar Relatório de Evidência" no perfil do aluno.

### [v1637: Agent Coordination]
- [MODIFY] [AgentOrchestratorService.ts](file:///c:/aquila/aquilapro_electron/src/services/AgentOrchestratorService.ts): 
    - Adicionar trigger: Agente Coordenador solicita "Análise de Outlier" ao Agente de Analytics.

## Verification Plan
### Automated Tests
1. Injetar dados de 30 alunos com 2 atrasos cada + 1 aluno com 10 atrasos -> Validar se o `BehavioralAnalyticsService` marca o aluno como "Outlier Crítico".
2. Gerar relatório comparativo -> Validar se as médias da turma batem com os dados injetados.

### Manual Verification
1. Abrir o `ParentPortal` e verificar o gráfico de comparação aluno/turma.
2. Gerar o PDF (mock) de evidência no `CoordinatorDashboard`.
