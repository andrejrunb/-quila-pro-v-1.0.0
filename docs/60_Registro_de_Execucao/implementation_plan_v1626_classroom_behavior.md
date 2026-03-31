# Implementation Plan - v1626: Classroom Behavioral Analytics & Student Portfolio

Este plano transforma o Áquila Pro em uma ferramenta de apoio pedagógico, analisando comportamentos dentro de sala de aula via RuView CSI.

## Proposed Changes

### [v1626-v1627: Precision Behavioral Analytics]
- [MODIFY] [SafetyMonitorService.ts](file:///c:/aquila/aquilapro_electron/src/services/SafetyMonitorService.ts): Adicionar assinaturas de "Baixa Atividade Prolongada" (Sono), "Hiperatividade" e **"Seating Posture"** (validação de posição na cadeira).
- [MODIFY] [IdentityBridgeService.ts](file:///c:/aquila/aquilapro_electron/src/services/IdentityBridgeService.ts): Implementar **"Radio ID Locking"** (CSI Fingerprinting) para evitar troca de identidade em abraços ou movimentos rápidos.
- [NEW] [StudentPortfolioService.ts](file:///c:/aquila/aquilapro_electron/src/services/StudentPortfolioService.ts): Serviço para persistir eventos comportamentais e gerar o relatório do portfólio.

### [UI: Student Portfolio View]
- [NEW] [StudentPortfolio.tsx](file:///c:/aquila/aquilapro_electron/src/ui/pages/StudentPortfolio.tsx): Nova página para visualizar o histórico de comportamento de um aluno específico.
- [MODIFY] [UnifiedCommand.tsx](file:///c:/aquila/aquilapro_electron/src/ui/pages/UnifiedCommand.tsx): Adicionar botão/link para abrir o portfólio a partir do rastro do aluno no mapa.

## Verification Plan
### Automated Tests
1. Simular sinal CSI com variância zero por 10 minutos -> Verificar se gera evento "Possível Sono".
2. Simular sinal CSI com variância alta e mudanças de coordenada frequentes (X,Y) dentro de um box de 3x3m -> Verificar se gera evento "Inquietude Crônica".

### Manual Verification
1. Selecionar um aluno identificado no mapa.
2. Clicar em "Ver Portfólio".
3. Verificar se o gráfico de comportamento exibe os picos de atividade detectados pelo sistema.
