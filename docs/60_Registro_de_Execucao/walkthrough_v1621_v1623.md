# Walkthrough: Analítica Avançada RuView (v1621-v1623)

Nesta etapa, elevamos a inteligência do Áquila Pro para detectar situações complexas de risco usando exclusivamente sinais de rádio (CSI).

## 1. Objetos Abandonados (v1621)
Implementamos a detecção de objetos estáticos no [SafetyMonitorService.ts](file:///c:/aquila/aquilapro_electron/src/services/SafetyMonitorService.ts).
- **Lógica**: Se um rastro de sinal aparece em um ponto fixo e permanece estável por mais de 10 minutos, o sistema identifica como um possível objeto abandonado (mochila, caixa) que pode obstruir rotas de fuga ou representar risco.

## 2. Detecção de Agressão & Pânico (v1622)
Adicionamos análise de alta frequência de movimento.
- **Assinatura de Luta**: O sistema agora detecta picos súbitos de variância e frequência no sinal CSI. Movimentos caóticos condizem com brigas ou correrias de pânico, gerando alertas imediatos "AGGRESSION_DETECTED" com severidade de emergência.

## 3. Gestão de Densidade (v1623)
Criamos o [CrowdManagerService.ts](file:///c:/aquila/aquilapro_electron/src/services/CrowdManagerService.ts).
- **Fluxo Seguro**: O sistema calcula a densidade de pessoas por metro quadrado em tempo real.
- **Dashboard**: No [UnifiedCommand.tsx](file:///c:/aquila/aquilapro_electron/src/ui/pages/UnifiedCommand.tsx), incluímos um HUD de densidade que avisa se áreas como o Hall Principal ou Pátios estão com aglomerações perigosas.

---
**Resultado**: Segurança preventiva de nível militar sem invadir a privacidade visual (zero câmeras).
