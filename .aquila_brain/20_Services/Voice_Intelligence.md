# 🎙️ Voice & Panic Intelligence (Phase 255/401+)

O Áquila Pro utiliza análise heurística de áudio para identificar situações críticas antes mesmo da detecção visual plena.

## ⚙️ Especificação Técnica
- **Motor**: `VoiceAnalysisService.ts`
- **Métricas Analisadas**:
  - **Decibéis (dB)**: Monitoramento de picos de ruído (> 90dB ativa alertas de pânico).
  - **Frequência (Hz)**: Identificação de assinaturas vocais de estresse/gritos.
  - **NLP de Borda**: Detecção de palavras-chave críticas (SOCORRO, FOGO, BRIGA).

## 🛡️ Casos de Uso
1. **Pátio Silencioso**: Detecção de som de impacto ou quebra de vidro.
2. **Ambiente Hostil**: Identificação automática de brigas verbais.
3. **Pânico**: Alerta instantâneo para a central SOC em caso de gritos.

---
Vincular a: [[10_Architecture/Unified_Command_SOC|Unified Command SOC]]
