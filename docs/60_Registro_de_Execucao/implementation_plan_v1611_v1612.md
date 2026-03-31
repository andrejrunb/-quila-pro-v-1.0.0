# Implementation Plan - v1611 & v1612: Passive Fall & Multi-Site

Este lote foca em segurança proativa para áreas privadas e gestão estratégica de múltiplas unidades escolares.

## Proposed Changes

### [Fall Detection Engine - v1611]
- [MODIFY] [wifi_signal_engine.py](file:///c:/aquila/aquilapro_electron/python/wifi_signal_engine.py): Implementar `fall_detection_proxy` analisando o delta de intensidade do sinal (assinatura horizontal).
- [NEW] [SafetyMonitorService.ts](file:///c:/aquila/aquilapro_electron/src/services/SafetyMonitorService.ts): Serviço para orquestrar alertas de segurança passiva (queda/inatividade).

### [Multi-Site Dashboard - v1612]
- [NEW] [GlobalNetworkConsole.tsx](file:///c:/aquila/aquilapro_electron/src/ui/pages/GlobalNetworkConsole.tsx): Painel de visão global com agregados de múltiplas escolas (métrica de segurança média, alertas pendentes).
- [MODIFY] [UnifiedCommand.tsx](file:///c:/aquila/aquilapro_electron/src/ui/pages/UnifiedCommand.tsx): Adicionar seletor de "Unidade / Escola" no cabeçalho premium.

## Verification Plan
### Automated Tests
- Simular uma queda (mudança súbita de assinatura de sinal) no `wifi_signal_engine.py` e verificar se o `SafetyMonitorService` emite `ALERT_FALL` em < 2s.
### Manual Verification
- O administrador alterna entre "Escola Matriz" e "Unidade II" no seletor global, observando os dados mudarem instantaneamente.
