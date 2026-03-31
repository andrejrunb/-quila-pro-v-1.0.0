# Implementation Plan - v1621-v1623: Advanced RuView Analytics

Este plano implementa lógica de processamento de sinal avançada para detectar riscos complexos de segurança e operacionais.

## Proposed Changes

### [v1621: Unattended Object Detection]
- [MODIFY] [SafetyMonitorService.ts](file:///c:/aquila/aquilapro_electron/src/services/SafetyMonitorService.ts): Implementar detecção de "Objetos Estáticos Inesperados". Se a variância do CSI em um ponto fixo mudar (indica um novo objeto) e permanecer estável por > 10 min, dispara alerta.

### [v1622: Aggression & Fight Detection]
- [MODIFY] [SafetyMonitorService.ts](file:///c:/aquila/aquilapro_electron/src/services/SafetyMonitorService.ts): Adicionar análise de "Alta Dinâmica". Detectar picos de frequência no sinal RuView que correspondam a movimentos bruscos e caóticos (correr, brigar, debater-se).

### [v1623: Crowd Density Management]
- [NEW] [CrowdManagerService.ts](file:///c:/aquila/aquilapro_electron/src/services/CrowdManagerService.ts): Monitora a densidade de pessoas por m² em zonas de trânsito (corredores, pátios). Emite alertas de "Congestionamento" se ultrapassar 3 pessoas/m².

### [Dashboard Integration]
- [MODIFY] [UnifiedCommand.tsx](file:///c:/aquila/aquilapro_electron/src/ui/pages/UnifiedCommand.tsx): Adicionar visualização de "Heatmap de Densidade" e novos feeds de alertas de violência/objetos.

## Verification Plan
### Automated Tests
1. Simular CSI estável com offset (objeto). Verificar alerta v1621 após 10 ciclos.
2. Simular sinal ruidoso de alta amplitude (luta). Verificar alerta v1622 imediato.

### Manual Verification
1. Abrir o mapa RuView.
2. Verificar se o heatmap reflete a densidade corretamente.
3. Observar o feed de notificações para alertas de segurança comportamental.
