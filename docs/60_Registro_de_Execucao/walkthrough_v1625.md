# Walkthrough: Visão Preditiva Guida por WiFi (v1625)

Nesta etapa, implementamos a "presciência" no sistema, onde o WiFi ajuda as câmeras a saberem quem esperar.

## 1. Lógica Presciente
Atualizamos o [IdentityBridgeService.ts](file:///c:/aquila/aquilapro_electron/src/services/IdentityBridgeService.ts) com o método `getPredictedSubjects`.
- **Antecipação Espacial**: O sistema calcula se um aluno identificado via WiFi está se aproximando das coordenadas de uma câmera específica.
- **Redução de Carga**: Esta informação é enviada ao backend de visão para que ele otimize a busca facial, focando apenas nos candidatos prováveis.

## 2. Interface de Alerta (Live Matrix)
Atualizamos o [UnifiedCommand.tsx](file:///c:/aquila/aquilapro_electron/src/ui/pages/UnifiedCommand.tsx).
- **Label "PRE-ID"**: Quando um aluno (ex: Andrej) se aproxima de uma câmera no modo Live Matrix, um alerta pulsante aparece: *"PRE-ID: Andrej Approaching"*.
- **Conformidade de Segurança**: Isso permite que o operador já saiba quem está entrando em uma sala ou corredor antes mesmo do rosto estar nítido o suficiente para o reconhecimento 100% visual.

---
**Conclusão**: O WiFi e as Câmeras agora trabalham em simbiose total. O WiFi fornece o contexto prévio (Quem está chegando?), e a Câmera fornece a confirmação final (Sim, é ele!).
