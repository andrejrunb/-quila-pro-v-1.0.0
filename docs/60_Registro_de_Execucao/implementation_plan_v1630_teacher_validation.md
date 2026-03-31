# Implementation Plan - v1630: Teacher Validation & Path Analysis

Este plano aprimora o rastreamento de saídas (v1629) adicionando um fluxo de revisão humana para validar a veracidade dos destinos declarados pelos alunos.

## Proposed Changes

### [v1630: Validation Workflow]
- [MODIFY] [PedagogicalReportingService.ts](file:///c:/aquila/aquilapro_electron/src/services/PedagogicalReportingService.ts): 
    - Adicionar `pathReviews` ao relatório de sessão.
    - Cada review contém `studentId`, `actualZonesVisited` e `validationStatus` (Pendente, Confirmado, Divergente).
- [MODIFY] [StudentPortfolioService.ts](file:///c:/aquila/aquilapro_electron/src/services/StudentPortfolioService.ts): 
    - Implementar lógica para penalizar o score apenas após a marcação de "Divergente" pelo professor.
    - Cruzar dados de divergência entre diferentes aulas.

### [UI: Teacher Review Portal]
- [MODIFY] [TeacherDashboard.tsx](file:///c:/aquila/aquilapro_electron/src/ui/pages/TeacherDashboard.tsx): 
    - Adicionar modal de "Revisão de Trajetória".
    - Botões "Confere" e "Não Confere" para cada saída registrada.

## Verification Plan
### Automated Tests
1. Gerar relatório de aula -> Marcar como "Divergente" -> Verificar se o Score do aluno cai no Portfólio.
2. Simular 3 desvios em turmas diferentes -> Verificar se a IA emite "ALERTA CRÍTICO DE COMPORTAMENTO" para a coordenação.

### Manual Verification
1. Abrir o Teacher Dashboard.
2. Clicar em "Revisar Saídas".
3. Validar uma saída mockada (ex: Andrej foi à lanchonete) e verificar o log no portfólio.
