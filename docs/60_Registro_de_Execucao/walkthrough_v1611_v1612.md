# Walkthrough: Bem-Estar Passivo & Gestão Multi-Site (v1611-v1612)

Avançamos mais 2 etapas críticas no roadmap do Áquila Pro, expandindo a proteção para áreas de privacidade e a gestão para o nível de rede escolar.

## 1. Detecção Passiva de Quedas (v1611)
Implementamos a capacidade de detectar quedas usando apenas sinais de rádio (RuView), eliminando a necessidade de câmeras em banheiros e vestiários.
- **Motor de Sinais**: O [wifi_signal_engine.py](file:///c:/aquila/aquilapro_electron/python/wifi_signal_engine.py) agora identifica a "assinatura de queda" através da mudança na intensidade do sinal refletido.
- **Alertas SOC**: O [SafetyMonitorService.ts](file:///c:/aquila/aquilapro_electron/src/services/SafetyMonitorService.ts) processa essa telemetria e emite alertas visuais imediatos no painel principal.

## 2. Global Network Console (v1612)
Criamos a visão de nível superior para gestores de redes de ensino (franquias ou secretarias).
- **Painel Global**: A nova página **[GlobalNetworkConsole.tsx](file:///c:/aquila/aquilapro_electron/src/ui/pages/GlobalNetworkConsole.tsx)** permite visualizar o status de segurança de todas as unidades conectadas, métricas de saúde e incidentes ativos em um mapa global simulado.
- **Navegação Fluida**: O [UnifiedCommand](file:///c:/aquila/aquilapro_electron/src/ui/pages/UnifiedCommand.tsx) agora possui um seletor de unidade no cabeçalho, permitindo "mergulhar" em uma escola específica ou retornar à visão da rede com um clique.

---
**Status Final**: v1611/12 Integrados. Próximo: Biometria Nativa Mobile (v1613).
