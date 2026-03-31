# Implementation Plan - v1616: Infrastructure Planning & WiFi Optimization

Este plano foca em transformar o mapeamento técnico em inteligência de infraestrutura, sugerindo a expansão da rede RuView com baixo custo.

## User Review Required
> [!NOTE]
> O orçamento é baseado no valor médio de mercado (R$ 89,00/unid) para repetidores de entrada (300-1200Mbps). Para precisão cirúrgica de RuView, recomendamos no mínimo 3 nós por ambiente.

## Proposed Changes

### [Network Planner - v1616]
- [NEW] [NetworkPlannerService.ts](file:///c:/aquila/aquilapro_electron/src/services/NetworkPlannerService.ts): Lógica que analiza a densidade de `surveyPoints` e sugere coordenadas X/Y para novos repetidores.
- [NEW] [InfrastructureBudget.tsx](file:///c:/aquila/aquilapro_electron/src/ui/components/InfrastructureBudget.tsx): Componente que exibe a cotação estimada para a cobertura total do ambiente mapeado.

### [Dashboard Integration]
- [MODIFY] [UnifiedCommand.tsx](file:///c:/aquila/aquilapro_electron/src/ui/pages/UnifiedCommand.tsx): Adicionar aba "Infrastructure Planner" que exibe os pontos sugeridos no mapa e o botão de orçamento.

## Verification Plan
### Automated Tests
- Injetar uma varredura com "buracos" de sinal e verificar se o `NetworkPlannerService` sugere ao menos 1 ponto de reforço.
### Manual Verification
- O técnico finaliza a varredura, abre o painel de Infraestrutura e vê pequenos ícones azuis pulsantes no mapa onde falta cobertura, com o valor total da expansão calculado abaixo.
