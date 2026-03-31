# Walkthrough: Inteligência IoT & Comportamental (v1619-v1620)

Nesta etapa, focamos na proteção proativa dos ativos físicos e na detecção de comportamentos anômalos que possam indicar riscos à segurança escolar.

## 1. Monitoramento Térmico IoT (v1619)
Implementamos o [ClimateMonitorService.ts](file:///c:/aquila/aquilapro_electron/src/services/ClimateMonitorService.ts) e o widget [ClimateHUD.tsx](file:///c:/aquila/aquilapro_electron/src/ui/components/ClimateHUD.tsx).
- **Proteção de Servidores**: O sistema monitora a temperatura da Sala de Servidores em tempo real.
- **Alertas Críticos**: Se a temperatura ultrapassar 28°C, o HUD no painel principal pulsa em vermelho e dispara um alerta visual imediato.

## 2. Detecção de Vadiagem / Loitering (v1620)
Expandimos o [SafetyMonitorService.ts](file:///c:/aquila/aquilapro_electron/src/services/SafetyMonitorService.ts) com análise de "Dwell Time".
- **Comportamento Suspeito**: O sistema agora rastreia quanto tempo cada pessoa (@CSI) permanece em uma mesma zona.
- **Zonas Restritas**: Se alguém ficar mais de 5 minutos parado em um local sem autorização, o sistema emite um alerta de "Loitering Detected".

## 3. Painel de Controle Unificado
Integramos tudo no [UnifiedCommand.tsx](file:///c:/aquila/aquilapro_electron/src/ui/pages/UnifiedCommand.tsx).
- O administrador agora tem uma visão 360°: Saúde da rede WiFi, Biometria de Pais, Climatização da infraestrutura e Segurança Preventiva.

---
**Status Final**: Ativos físicos e perímetros protegidos via inteligência artificial passiva.
