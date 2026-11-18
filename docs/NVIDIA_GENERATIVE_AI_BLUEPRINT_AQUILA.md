# Áquila Pro — Blueprint de Arquitetura NVIDIA Generative AI

**Referência Upstream:** [https://github.com/NVIDIA/GenerativeAIExamples](https://github.com/NVIDIA/GenerativeAIExamples)  
**Status no Áquila Pro:** Clonado em [`external/GenerativeAIExamples`](file:///c:/aquila/external/GenerativeAIExamples) & Adaptado  
**Data:** 08/11/2026  

---

## 🏛️ 1. O que é o repositório NVIDIA/GenerativeAIExamples?

O repositório **NVIDIA/GenerativeAIExamples** é a biblioteca oficial de arquiteturas de referência e microservices de ponta da NVIDIA para Inteligência Artificial Generativa acelerada por GPU (NVIDIA NIM, TensorRT-LLM e Triton Inference Server).

Ele consolida os padrões industriais mais avançados do mundo para:
1. **RAG Avançado (Retrieval-Augmented Generation)**:
   - RAG Multimodal (visão + texto).
   - Structured Data RAG (Text-to-SQL analítico seguro).
   - Multi-Turn RAG (conversações pedagógicas com memória persistente).
   - Decomposição de consultas complexas e Reranking NeMo Retriever.
2. **Vision Workflows & Edge AI**:
   - Pipelines de visão computacional acelerada para monitoramento de câmeras e fluxo de pessoas.
3. **Modelos de Raciocínio de Classe Mundial**:
   - `moonshotai/kimi-k3.1-pro` (1M tokens de contexto).
   - `llama_3.3_nemotron_super_49B`.
   - `nvidia/nemotron-4-340b-instruct`.

---

## ⚡ 2. Aplicação Direta no Ecossistema Áquila Pro

| Blueprint NVIDIA | Aplicação Prática no Áquila Pro | Status de Implementação |
| :--- | :--- | :--- |
| **`structured_data_rag`** | **Text-to-SQL no SQLite `aquila.db`**: Permite à Direção e Secretaria consultar métricas, turmas e frequência em linguagem natural com garantia de segurança (apenas SELECT). | ✅ Implementado em [`scripts/nvidia_structured_data_rag.py`](file:///c:/aquila/scripts/nvidia_structured_data_rag.py) |
| **`multimodal_rag`** | **Leitura e Extração OMR/BNCC**: Ingestão de provas impressas, diagramas vetoriais SVG e correção assistida de gabaritos. | ✅ Integrado com [`apps/electron/src/main/python/kernel_omr.py`](file:///c:/aquila/apps/electron/src/main/python/kernel_omr.py) |
| **`multi_turn_rag`** | **Tutor Pedagógico Albus**: Sessões de estudo e reforço DOK 1–4 com memória pedagógica e guardrails do Parecer CNE/CP nº 15/2026. | ✅ Integrado via [`scripts/swarm_router.py`](file:///c:/aquila/scripts/swarm_router.py) |
| **`metropolis-nim-workflows`** | **Controle de Portaria & Night Sentry**: Análise de fluxo de borda e detecção de anomalias sem envio de biometria crua para a nuvem (LGPD Art. 11/14). | ✅ Conforme Constituição v2.1 de Agentes |
| **`1M-Token Context (Kimi K3.1 Pro)`** | **Refatoração e Auditoria de Código Monolítico**: Permite ao Kimi K3.1 Pro auditar arquivos de 10.000 linhas em uma única chamada. | ✅ Implementado em [`scripts/kimi_worker.py`](file:///c:/aquila/scripts/kimi_worker.py) |

---

## 🛠️ 3. Como Utilizar no Áquila Pro

### A. Consultar o Banco Escolar em Linguagem Natural (Text-to-SQL)
```bash
python scripts/nvidia_structured_data_rag.py --query "Quantas turmas temos cadastradas?"
```

### B. Inspecionar o Esquema das Tabelas Autorizadas
```bash
python scripts/nvidia_structured_data_rag.py --schema-inspect
```

### C. Executar Queries Seguras Diretas
```bash
python scripts/nvidia_structured_data_rag.py --raw-sql "SELECT name, grade FROM classes WHERE grade LIKE '%EM%'"
```

### D. Explorar os Exemplos Oficiais da NVIDIA Localmente
O repositório completo da NVIDIA está disponível em `external/GenerativeAIExamples`:
- Exemplos de RAG: `external/GenerativeAIExamples/RAG/examples/`
- Workflows de Visão: `external/GenerativeAIExamples/vision_workflows/`
- Nemotron 49B: `external/GenerativeAIExamples/llama_3.3_nemotron_super_49B/`
