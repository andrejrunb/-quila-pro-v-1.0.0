# Implementation Plan - v1628: Pedagogical Dispatch & Grading Support

Este plano automatiza o envio de relatórios para os professores e transforma dados de rádio em métricas de avaliação.

## Proposed Changes

### [v1628: Automated Reporting & Teacher Mapping]
- [MODIFY] [SchedulingEngine.ts](file:///c:/aquila/aquilapro_electron/src/services/SchedulingEngine.ts): Adicionar associação de `teacherId` e `teacherName` às sessões de aula.
- [NEW] [PedagogicalReportingService.ts](file:///c:/aquila/aquilapro_electron/src/services/PedagogicalReportingService.ts): Serviço que consolida os eventos do `StudentPortfolioService` por aula e dispara notificações ao professor.
- [MODIFY] [StudentPortfolioService.ts](file:///c:/aquila/aquilapro_electron/src/services/StudentPortfolioService.ts): Implementar o `calculateEngagementScore(studentId, period)` para converter comportamento em escala de 0-10.

### [UI: Teacher Dispatch HUD]
- [NEW] [TeacherDashboard.tsx](file:///c:/aquila/aquilapro_electron/src/ui/pages/TeacherDashboard.tsx): Interface simplificada para o professor ver o "Ranking de Engajamento" da sua turma atual.

## Verification Plan
### Automated Tests
1. Simular fim de aula -> Verificar se o `PedagogicalReportingService` gera um JSON de resumo para o e-mail do professor.
2. Verificar se alunos com "Focus Period" alto recebem Score > 8.0, enquanto alunos com "Restlessness" alta recebem penalização.

### Manual Verification
1. Logar como professor.
2. Abrir a aba "Minhas Turmas".
3. Visualizar o relatório sugerido de "Participação Bimestral" gerado automaticamente pela IA Áquila.
