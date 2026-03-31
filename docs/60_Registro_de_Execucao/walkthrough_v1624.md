# Walkthrough: Escudo de Identidade Híbrida (v1624)

Nesta etapa, resolvemos o desafio de identificar *quem* está sendo rastreado pelo sistema sem câmeras, usando a sinergia entre visão computacional e WiFi.

## 1. Ponte de Identidade Digital
Implementamos o [IdentityBridgeService.ts](file:///c:/aquila/aquilapro_electron/src/services/IdentityBridgeService.ts).
- **Enlistamento Passivo**: O sistema agora correlaciona o momento em que uma câmera reconhece um rosto com o rastro RuView (WiFi) na mesma posição.
- **Batismo de Sinal**: Uma vez que a câmera identifica "João", o rastro WiFi `A01` passa a ser rotulado como "João" em todo o campus.

## 2. Visualização no Unified Command
Atualizamos o [UnifiedCommand.tsx](file:///c:/aquila/aquilapro_electron/src/ui/pages/UnifiedCommand.tsx) com labels de identidade.
- **Labels Flutuantes**: No mapa 3D, os pontos de sinal agora exibem o nome do aluno em tempo real.
- **Rastreio "Blind-Spot"**: Se o aluno entrar em um local sem câmeras, o nome continua aparecendo no mapa, pois o sistema mantém o vínculo via rede WiFi.

## 3. Segurança Inteligente
- **Identificação de Desconhecidos**: Se o sistema detectar um rastro WiFi que não foi identificado por nenhuma câmera ou tag, ele pode ser sinalizado como "Visitante não identificado".

---
**Resultado**: O Áquila Pro agora possui uma "memória espacial" que une a precisão visual das câmeras com a persistência invisível do WiFi.
