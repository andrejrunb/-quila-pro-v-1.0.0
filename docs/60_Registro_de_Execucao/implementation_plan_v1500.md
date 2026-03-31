# Implementation Plan: Phase 1500 — Advanced Analytics & Management Intelligence

Este marco transforma o Áquila Pro em uma central de inteligência analítica, inspirada pelas capacidades de visualização do Apache Superset e pela memória de contexto do Supermemory.

## Objetivos
1. **Agregação de Dados em Massa**: Processar milhares de registros de presença e eventos IoT para extrair tendências.
2. **Dashboards Interativos**: Implementar gráficos de série temporal e mapas de calor usando `recharts`.
3. **Análise Preditiva Simples**: Identificar alunos com risco de evasão baseado em padrões de presença.

### [Componentes Principais]

#### [NEW] [AnalyticsService.ts](file:///c:/aquila/aquilapro_electron/src/services/AnalyticsService.ts)
- Serviço responsável por queries complexas de agregação (COUNT, AVG, GROUP BY) no SQLite.
- Método `getEngagementTrends(period)`: Retorna dados estruturados para gráficos.
- Método `getRiskAssessment()`: Identifica anomalias no comportamento de frequência.

#### [MODIFY] [ClimateReportPanel.tsx](file:///c:/aquila/aquilapro_electron/src/ui/pages/ClimateReportPanel.tsx)
- Substituir placeholders por componentes `recharts` reais.
- Adicionar gráfico de linha para "Evolução do Clima Escolar".

#### [MODIFY] [main.ts](file:///c:/aquila/aquilapro_electron/src/main.ts)
- Registrar novos IPC Handlers para o `AnalyticsService`.

## Plano de Verificação

### Testes Automatizados
- Simular a inserção de 1.000 registros de presença.
- Verificar se o `AnalyticsService` retorna a agregação correta por dia.

### Verificação Manual
- Navegar até o painel de Inteligência de Gestão.
- Verificar se os gráficos são renderizados corretamente e respondem a diferentes filtros de período.
