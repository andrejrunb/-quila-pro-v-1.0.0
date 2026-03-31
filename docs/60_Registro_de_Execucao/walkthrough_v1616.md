# Walkthrough: Planejador de Infraestrutura & Otimização (v1616)

Nesta etapa, transformamos o Áquila Pro em um consultor estratégico de infraestrutura para a escola.

## 1. Mapeamento Inteligente de Repetidores
O novo [NetworkPlannerService.ts](file:///c:/aquila/aquilapro_electron/src/services/NetworkPlannerService.ts) agora analisa a varredura feita pelo técnico. 
- Se o técnico caminhar pela escola e o sistema detectar que certas áreas estão com sinal fraco ou inexistente para o RuView, ele marca automaticamente as coordenadas para instalação de novos nós.

## 2. Orçamentação Automática (Budget HUD)
Criamos o componente [InfrastructureBudget.tsx](file:///c:/aquila/aquilapro_electron/src/ui/components/InfrastructureBudget.tsx).
- Ao final de uma varredura, o sistema abre uma janela de orçamento.
- Ele calcula o custo total baseado no número de repetidores sugeridos (usando o valor de mercado de R$ 89,90/unid).
- Exibe ganhos estimados em precisão de rastreamento (CSI Coverage).

## 3. Integração no Dashboard
O [UnifiedCommand](file:///c:/aquila/aquilapro_electron/src/ui/pages/UnifiedCommand.tsx) agora orquestra esse fluxo. O gestor pode ver exatamente onde investir para ter uma escola 100% segura e monitorada por rádio.

---
**Status Final**: Módulo de Infraestrutura Integrado. Próximo: Batch 6 (Sinais IoT e Alertas de Agrupamento).
