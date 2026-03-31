# Walkthrough: Programa de Afiliados & Procurement (v1617)

Nesta etapa, elevamos o Áquila Pro a um novo patamar de sustentabilidade comercial e facilidade operacional.

## 1. Cadastro de Hardware Verificado
Criamos o [AffiliateService.ts](file:///c:/aquila/aquilapro_electron/src/services/AffiliateService.ts) que centraliza os produtos homologados pela nossa arquitetura.
- **WiFi Repeaters**: Links parametrizados com seu ID de afiliado para o repetidor que você nos enviou.
- **Sensores IoT**: Já deixamos pronto para os próximos passos de automação (v1618).

## 2. Compra Direta no Orçamento
O painel de [InfrastructureBudget](file:///c:/aquila/aquilapro_electron/src/ui/components/InfrastructureBudget.tsx) agora é transacional.
- Após o planejamento da rede, o gestor pode clicar em "Comprar Hardware Verificado" e ser levado instantaneamente ao link de compra oficial.

## 3. Marketplace Global de Rede
No [GlobalNetworkConsole](file:///c:/aquila/aquilapro_electron/src/ui/pages/GlobalNetworkConsole.tsx), adicionamos uma vitrine de "Marketplace de Infraestrutura".
- Ideal para redes de ensino que precisam padronizar o hardware entre 10, 20 ou mais escolas de uma vez só.

---
**Status Final**: Sistema de Afiliados Integrado. Próximo: Batch 7 (v1618 - Sensores Industriais e v1619 - Análise Térmica).
