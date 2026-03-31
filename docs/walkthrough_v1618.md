# Walkthrough: Planejador de Compras Inteligente (v1618)

Nesta etapa, transformamos o Áquila em um consultor estratégico de infraestrutura. O sistema agora não apenas sugere o quê comprar, mas adapta as sugestões à realidade financeira e física da escola.

## 1. Tiers de Hardware (Eco vs. Enterprise)
Refatoramos o [AffiliateService.ts](file:///c:/aquila/aquilapro_electron/src/services/AffiliateService.ts) para suportar categorias de hardware:
- **Economy**: Focado em custo-benefício (Ex: Repetidores básicos, Mini PCs Celeron). Ideal para escolas menores ou planos básicos.
- **Enterprise**: Hardware de alta performance (Ex: APs WiFi 6 Mesh, Estações com IA local). Ideal para grandes redes e segurança máxima.

## 2. Interface "Kit Builder"
Implementamos o [ProcurementKitBuilder.tsx](file:///c:/aquila/aquilapro_electron/src/ui/components/ProcurementKitBuilder.tsx) que permite ao técnico/gestor:
- Selecionar o porte da escola (Pequena, Média, Grande).
- Alternar entre "Plano Econômico" e "Plano Enterprise".
- Ver o orçamento total subir ou descer instantaneamente conforme a escolha da qualidade dos equipamentos.

## 3. Integração no Console Global
O [GlobalNetworkConsole](file:///c:/aquila/aquilapro_electron/src/ui/pages/GlobalNetworkConsole.tsx) agora possui um botão de "Novo Projeto de Implantação" que lança este planejador no topo de toda a rede de escolas.

---
**Resultado**: Orçamentos precisos, prazos definidos e hardware adequado à realidade de cada cliente.
