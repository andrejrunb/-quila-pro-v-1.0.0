# Implementation Plan - v1619-v1620: IoT & Safety Intelligence

Este plano foca na proteção de ativos críticos (Salas de Servidores) e na inteligência de comportamento preventivo.

## Proposed Changes

### [v1619: IoT Thermal Monitor]
- [NEW] [ClimateMonitorService.ts](file:///c:/aquila/aquilapro_electron/src/services/ClimateMonitorService.ts): Processa telemetria de sensores de temperatura/umidade. Dispara alertas se ultrapassar 28°C em áreas críticas.
- [NEW] [ClimateHUD.tsx](file:///c:/aquila/aquilapro_electron/src/ui/components/ClimateHUD.tsx): Widget flutuante para o Unified Command mostrando o status térmico da Sala de Servidores.

### [v1620: Loitering Detection]
- [MODIFY] [SafetyMonitorService.ts](file:///c:/aquila/aquilapro_electron/src/services/SafetyMonitorService.ts): Adicionar lógica de "Dwell Time". Se um rastro (CSI) permanecer > 5 min em zona não autorizada (ex: fundos da escola), dispara alerta de "Possível Intrusão/Vadiagem".

### [Dashboard Integration]
- [MODIFY] [UnifiedCommand.tsx](file:///c:/aquila/aquilapro_electron/src/ui/pages/UnifiedCommand.tsx): Integrar o `ClimateHUD` e os novos alertas de comportamento.

## Verification Plan
### Automated Tests
1. Simular sensor de temperatura enviando 32°C. Verificar se o `ClimateHUD` vira vermelho e dispara notificação push.
2. Simular rastro 'X' parado em 'Zona_F' por 6 minutos. Verificar se `SafetyMonitorService` emite evento `LOITERING_DETECTED`.

### Manual Verification
1. Abrir o Unified Command.
2. Observar o novo widget de temperatura.
3. Verificar se o log de eventos registra "Comportamento Suspeito" ao simular permanência longa no mapa.
