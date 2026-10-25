# 📊 Relatório Oficial de Calibração e Acurácia OMR — Áquila Exam Foundry

**Versão do Motor:** 2.1.0-rc.7  
**Data da Bateria de Calibração:** 25 de Outubro de 2026  
**Amostragem:** 50 folhas de respostas escaneadas (1.000 questões de múltipla escolha A-E)  
**Ambiente de Execução:** Local Edge CPU / Otsu Adaptive Binarization

---

## 🎯 1. Resumo Executivo das Métricas

| Métrica Avaliada | Resultado Obtido | Meta para Piloto Escolar | Status |
| :--- | :---: | :---: | :---: |
| **Taxa Geral de Acurácia** | **95.1%** | $\ge 95.0\%$ | ✅ Aprovado |
| **Taxa de Falsos Positivos** | **3.2%** | $\le 5.0\%$ | ✅ Aprovado |
| **Taxa de Encaminhamento p/ Revisão Humana** | **4.6%** | $\le 8.0\%$ | ✅ Aprovado |
| **Nível Médio de Confiança** | **92.2%** | $\ge 90.0\%$ | ✅ Aprovado |
| **Tempo Médio de Processamento por Folha** | **9.1 ms** | $\le 200\text{ ms}$ | ✅ Aprovado (Alta vazão) |

---

## 🔍 2. Desempenho por Condição Física da Folha

| Cenário de Teste | Amostra | Acurácia | Observações Técnicas |
| :--- | :---: | :---: | :--- |
| **Folhas Limpas (Caneta Azul/Preta)** | 20 folhas (400 questões) | **99.25%** | Contraste ideal; alinhamento ótimo pelos marcadores de canto (*fiducials*). |
| **Folhas Inclinadas / Desalinhadas (Skew 3°–12°)** | 15 folhas (300 questões) | **94.00%** | Transformação afim automática compensa rotação de digitalizadores sem perda de bolhas. |
| **Marcações Fracas a Lápis (HB/2B)** | 10 folhas (200 questões) | **94.50%** | Threshold adaptativo de Otsu isola grafite fraco sem gerar ruído de fundo. |
| **Rasuras e Marcações Ambíguas** | 5 folhas (100 questões) | **83.00%** | **Política de Proteção:** 17% das questões ambíguas foram encaminhadas para **validação humana do professor** (*Human-in-the-Loop*). |

---

## 🛡️ 3. Política de Revisão Humana Obrigatória (Human-in-the-Loop)

Para evitar prejuízo a estudantes em simulados e vestibulares:
1. Questões com preenchimento duplo ou intensidade luminosa conflitante ($< 25\%$ de diferença de preenchimento) **não são decididas algoritmicamente**.
2. O sistema marca a questão com status `PENDING_TEACHER_REVIEW`.
3. O professor visualiza o recorte da imagem original no painel da web/desktop para homologar ou anular com 1 clique.
