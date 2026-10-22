---
title: Chamada Inteligente Facial Edge NPU & Radar de Infrequência LDB
date: 2026-10-20
tags:
  - pedagogia
  - chamada
  - npu
  - visao-computacional
  - ldb-art12
  - frequencia
  - impressao
---

# 📸 Chamada Inteligente Facial Edge NPU & Radar de Infrequência LDB (v3.0.0 Soberano)

O módulo **Chamada Inteligente** (`AttendanceCall.tsx`) consolida o paradigma **Zero-Typing Classroom** no ecossistema docente do Colégio Visão / Áquila Pro. Integrando **reconhecimento biométrico facial local em Edge NPU (26 TOPS)** com os preceitos de conformidade da **Lei de Diretrizes e Bases da Educação Nacional (LDB nº 9.394/1996, Art. 12, VII)**, o sistema elimina a digitação manual de presenças e automatiza o dever legal de notificação de evasão.

---

## ⚡ 1. Arquitetura de Visão Computacional & Biometria Edge

A chamada biométrica opera com privacidade absoluta, sem envio de frames ou vetores biométricos para servidores em nuvem externa:

1. **Hardware NPU Local (26 TOPS)**:
   - Processamento de embeddings faciais de 512 dimensões (modelo InsightFace / ArcFace quantizado para int8).
   - Similaridade de cosseno com limiar rigoroso ($\ge 0.90$).
2. **Ciclo de Auto-Chamada**:
   - Ativação do stream de câmera da sala de aula via WebRTC local ou sensor RTSP.
   - Retículo holográfico de escaneamento em tempo real (`.scanning-reticle`).
   - Identificação instantânea dos estudantes presentes na sala de aula em menos de 4 segundos para turmas de até 40 alunos.
   - Atribuição automática de escore de confiança biométrica por aluno (ex: `98.4% NPU`).

---

## ⚖️ 2. Radar de Infrequência Escolar (LDB nº 9.394/1996, Art. 12, VII)

A legislação federal brasileira determina expressamente:

> **Art. 12. Os estabelecimentos de ensino, respeitadas as normas comuns e as do seu sistema de ensino, terão a incumbência de:**  
> *VII - notificar aos pais ou aos responsáveis, e ao Conselho Tutelar do Município, a relação dos alunos que apresentem quantidade de faltas acima de 30% (trinta por cento) do percentual permitido em lei;*

### 📊 Regra de Cálculo Legal no Áquila Pro:
- Carga anual obrigatória: **200 dias letivos** (ou 800 horas).
- Limite máximo de faltas permitido por lei: **25%** (50 faltas).
- Gatilho do **Art. 12, VII**: **30% do limite máximo** = **15 faltas acumuladas**.

Quando qualquer estudante atinge ou supera 15 ausências acumuladas no ano letivo:
- O sistema exibe o distintivo dourado: `⚠️ Alerta LDB: X faltas`.
- O docente ou coordenador pode clicar com 1 clique para disparar o comunicado aos responsáveis via WhatsApp/App Soberano sem intermediários de nuvem.

---

## 🖨️ 3. Ata Oficial de Frequência de Classe para Impressão

Para fins de arquivo físico, fiscalização do Ministério da Educação (MEC) e conselhos de classe bimestrais:

- O botão **"Imprimir Ata"** aciona o layout formal `@media print` otimizado para formato **A4 Portrait**.
- Inclui cabeçalho institucional do Colégio Visão, resumo estatístico (matriculados, presentes, percentual de presença), tabela com RA, nomes e situação, além de campos formais para assinatura do professor regente e visto da coordenação pedagógica.

---

## 🔒 4. Armazenamento Local e Resiliência SQA-1000

- **Canal Primário**: IPC `teachers:save-attendance` conectado ao SQLite SQA-1000.
- **Canal de Redundância**: `localStorage` criptografado localmente sob a chave `attendance_{classId}_{date}`, garantindo que mesmo em queda temporária de socket o docente nunca perca o registro da aula.
- **Notificações Fluidas**: Feedback em toasts flutuantes não-bloqueantes (`.attendance-toast`), eliminando caixas de diálogo modais invasivas (`alert()`).

---

*Documento homologado pelo Córtex Pedagógico Áquila Pro — Outubro/2026.*
