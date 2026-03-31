# Implementation Plan - v1618: Procurement Kit Builder

Este plano expande o sistema de afiliados para cobrir toda a infraestrutura física de uma escola, permitindo a criação de "Kits de Implantação" padronizados.

## Proposed Changes

### [Expanded Marketplace - v1618]
- [MODIFY] [AffiliateService.ts](file:///c:/aquila/aquilapro_electron/src/services/AffiliateService.ts): Adicionar categorias: `COMPUTER`, `TABLET`, `DISPLAY`, `SERVER`. Cadastrar produtos mock para cada.

### [Procurement Kit Builder]
- [NEW] [ProcurementKitBuilder.tsx](file:///c:/aquila/aquilapro_electron/src/ui/components/ProcurementKitBuilder.tsx): Interface que permite ao técnico selecionar o porte da escola (Pequena, Média, Grande) e gera automaticamente a lista de compras recomendada com links de afiliados.

### [Dashboard Integration]
- [MODIFY] [GlobalNetworkConsole.tsx](file:///c:/aquila/aquilapro_electron/src/ui/pages/GlobalNetworkConsole.tsx): Adicionar o `ProcurementKitBuilder` como ferramenta principal de expansão da rede.

## Verification Plan
### Manual Verification
1. Abrir o Global Console.
2. Clicar em "Novo Kit de Implantação".
3. Selecionar "Escola Média (500 alunos)".
4. Verificar se a lista inclui: 10 câmeras, 5 repetidores, 2 totens (TV+MiniPC) e os links de compra estão ativos.
