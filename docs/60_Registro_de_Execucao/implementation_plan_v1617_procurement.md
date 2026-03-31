# Implementation Plan - v1617: Affiliate Program & Procurement

Este plano integra a monetização direta no fluxo de infraestrutura, permitindo que a escola compre hardware verificado via links de afiliados.

## Proposed Changes

### [Affiliate Integration - v1617]
- [NEW] [AffiliateService.ts](file:///c:/aquila/aquilapro_electron/src/services/AffiliateService.ts): Registro de produtos testados com seus respectivos links (Amazon, Mercado Livre, etc.) e tags de verificação Áquila.
- [MODIFY] [InfrastructureBudget.tsx](file:///c:/aquila/aquilapro_electron/src/ui/components/InfrastructureBudget.tsx): Adicionar botões "Comprar via Áquila (Garantido)" que usam os links de afiliados cadastrados.

### [Procurement Dashboard]
- [MODIFY] [GlobalNetworkConsole.tsx](file:///c:/aquila/aquilapro_electron/src/ui/pages/GlobalNetworkConsole.tsx): Adicionar seção de "Marketplace de Rede" para gestores de múltiplas unidades comprarem hardware em lote.

## Verification Plan
### Automated Tests
- Verificar se o link de afiliado é gerado corretamente no `AffiliateService`.
### Manual Verification
- O gestor orça a expansão, clica em "Comprar via Áquila" e é redirecionado para a página do produto com o código de afiliado injetado.
