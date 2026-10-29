# 🦅 Áquila Pro — Enciclopédia & Guia Mestre de Orientações (/compact)
**Síntese Arquitetural, Histórica e Operacional de 121 Conversas do Projeto**  
*Data de Compilação: 29 de Outubro de 2026 | Sistema Operacional: Windows | Workspace: `c:\aquila`*

---

## 📌 Sumário Executivo (/compact)
Este documento é o repositório consolidado de **todas as decisões, regras de negócio, especificações pedagógicas, arquiteturas de código, modelos de IA e diretrizes de governança** acumuladas ao longo de mais de 100 sessões e 865 comandos do usuário no projeto **Áquila Pro (Escola Soberana OS v2.1 / v3.0)**.

Ele serve como o manual definitivo para qualquer nova sessão do Antigravity, eliminando amnésia de contexto e garantindo aderência absoluta à **Constituição Áquila (AGENTS.md)** e às preferências do usuário.

---

## 🏛️ 1. Arquitetura do Sistema & Stack Tecnológica

O Áquila Pro é um **Sistema Operacional Escolar Soberano (Local-First & Edge-Resilient)** concebido para operar em escolas públicas e privadas brasileiras, combinando software desktop de missão crítica, inteligência artificial local e aceleradores em nuvem controlada.

### A. Componentes do Monorepo (`c:\aquila`)
- **`apps/electron`**: Aplicação Desktop principal (Electron 30+ / Vite / React 18 / Tailwind CSS).
  - Processo Principal (`src/main.ts`, `src/preload.ts`): Gerencia IPC seguro, ciclo de vida do SO, janelas, SQLite local e monitoramento de hardware.
  - Renderer (`src/ui/`): Cockpits e Portais (Gestor, Professor, Aluno, Portaria, Responsáveis).
- **`apps/web`**: Portal Web complementar em Next.js (Dashboard administrativo e espelho de consultas).
- **`apps/mobile`**: Aplicação React Native / Expo para comunicação com responsáveis e alunos.
- **`swarm/`**: Infraestrutura de orquestração multiagente, datasets de fine-tuning (`aquila_finetune_dataset.jsonl`), scripts de benchmark e embeddings.
- **`colab/`**: Notebooks de treinamento e aceleração GPU (`aquila_a100_neural_engine.ipynb` para A100-80GB SXM4).
- **`acervo/`**: Repositório seguro e curado de mídias e fontes históricas (Internet Archive, livros, mapas, áudios com quarentena e integridade SHA-256).

### B. Bases de Dados SQLite (Local-First com WAL Mode)
O ecossistema Áquila rejeita bancos centralizados vulneráveis e opera com bases SQLite segregadas e criptografadas:
1. **`aquila.db`** (`apps/electron/dist/database/`): Usuários, matrículas, turmas, presenças biométricas, permissões e trilha `zero_bypass_audits`.
2. **`pedagogical_scaffolding.db`**: Motor psicométrico TRI, descritores SAEB/BNCC, banco de questões oficiais de vestibulares (ENEM, FUVEST, UNICAMP, ITA) e histórico adaptativo de aprendizagem.
3. **`aquila_knowledge_vec.db`**: Armazenamento vetorial de embeddings 512-D para busca semântica RAG e agrupamento conceitual.
4. **`acervo_multimodal_archive.db`**: Metadados, procedência, evidências legais (Lei 9.610/98 Art. 41) e índices de páginas/áudios do Internet Archive.

---

## 🧠 2. Inteligência Artificial, Hardware & GPUs

### A. Regra Soberana de Distribuição de Cargas (Constituição Rule 5)
- **Proibição de Processamento Monolítico:** O agente orquestrador nunca executa tarefas pesadas em sua própria CPU (auditorias massivas, treinamento de modelos, OCR de milhares de páginas).
- **Google Colab Pro (NVIDIA A100-80GB SXM4):** Treinamento de adaptadores LoRA BF16 ($r=16, \alpha=32$), quantização QLoRA e tarefas intensivas matriciais.
- **Edge NPU (26 TOPS):** Inferência local de visão computacional em catracas e câmeras escolares.
- **Auto-Throttling Térmico (`SovereignResilienceService`):** Se a temperatura da CPU/NPU ultrapassar 75ºC, a taxa de amostragem de visão reduz automaticamente de 30 FPS para 10 FPS até a normalização térmica.

### B. Biometria Facial Soberana (One-Way Embedding 512-D)
- Nenhum dado biométrico cru (fotos faciais de estudantes) sai do servidor local ou é persistido sem hash.
- O modelo extrai um vetor unidirecional de 512 dimensões (Cosine Similarity threshold > 0.68 para validação de acesso).
- Proteção criptográfica AES-256-GCM / Windows DPAPI.

---

## 📚 3. Motor Pedagógico, TRI & Integrações EdTech

### A. Teoria de Resposta ao Item (TRI) & SAEB/BNCC
- Implementado em `PedagogicalTriEngine.ts`.
- Estimação de proficiência latente $\theta$ (-4.0 a +4.0), convertida para a escala SAEB (Média 250, DP 50) e ENEM (Média 500, DP 100).
- Análise de consistência e detecção de chutes atípicos (Análise de Guttman e resíduos padronizados $z_i$).
- Diagnóstico automatizado por descritores SAEB (`descriptorCode`, `accuracyPct`, `masteryLevel`).

### B. Portais Integrados & Extração REA
1. **Positivo On & Plurall:**
   - Ingestão de questões de vestibulares (itens públicos sob a Lei 9.610/98 Art. 8º, IV).
   - Purga total de layouts e folhas de estilo proprietárias dos editores.
2. **Brisk Teaching:**
   - Adaptação das rotinas de feedback formativo ("Glows", "Grows" e "Next Steps") para a realidade pedagógica da BNCC.
3. **Wordwall (`WordwallGameEngine` & `WordwallInteractivePlayer`):**
   - 18 modalidades de jogos pedagógicos dinâmicos (Quiz, Abra a Caixa, Roleta, Caça-Palavras, Associação, etc.).
   - Integração com a Câmara de Maestria do Aluno.
4. **Internet Archive (`archive.org`):**
   - Adaptador oficial via endpoints `/advancedsearch.php` e `/metadata/{id}` (zero scraping cego).
   - Quarentena obrigatória com checksum SHA-256 antes da promoção para o acervo aprovado.
   - Avaliação rigorosa da Lei 9.610/98 Art. 41 (70 anos post-mortem para domínio público).

---

## 🎮 4. Gamificação, Câmara de Maestria & Experiência do Aluno

- **Student Mastery Chamber (`StudentMasteryChamber.tsx`):**
  - Arena PvP para resolução cronometrada de desafios.
  - Alternador de templates interativos (Quiz, Wordwall Games, Flashcards).
  - Reprodutor de mídia educacional integrado (vídeos YouTube selecionados e audiolivros de literatura).
- **Sistema de Recompensas & Cosméticos:**
  - Moedas escolares (Áquila Coins) ganhas por assiduidade, resolução de itens difíceis na TRI e comportamento exemplar.
  - Loja de avatares, bordas e títulos honoríficos.

---

## ⚖️ 5. Governança Legal, Privacidade & ECA Digital

1. **LGPD Art. 14 (Crianças e Adolescentes):**
   - Tratamento de dados no melhor interesse da criança.
   - Verificação obrigatória da matriz de consentimento parental antes de qualquer ativação biométrica.
2. **Lei 9.610/98 (Direitos Autorais):**
   - **Art. 8º, IV:** Questões de concursos e exames oficiais públicos (ENEM, FUVEST, UNICAMP, ITA) não são objeto de proteção autoral patrimonial.
   - **Art. 41:** Obras caem em domínio público 70 anos após 1º de janeiro do ano subsequente à morte do autor (ex: Machado de Assis [†1908 ➔ DP 1979], Maria Firmina dos Reis [†1917 ➔ DP 1988]).
   - **Art. 46:** Citação de trechos para fins pedagógicos é permitida com indicação clara de fonte e autoria.
3. **Trilha Zero-Bypass (`zeroBypassAuditService`):**
   - Toda mutação sensível de estado é registrada com timestamp ISO, identificador do usuário e hash SHA-256.

---

## 🛠️ 6. Histórico de Problemas Críticos & Soluções Comprovadas

| Sintoma / Erro Encontrado | Causa Raiz | Correção Definitiva Aplicada |
| :--- | :--- | :--- |
| **Vite Build Error (`Unexpected ""`)** | Substituição regex em Python gerou caractere ASCII bell (`\x07`) na string `\arena-template-btn`. | Script Python dedicado com leitura de strings exatas e sem escape acidental de barras. |
| **Plurall GraphQL Downstream Error** | A query `Questions` no Apollo falhou em disciplinas combinadas. | Migração para a query `Contents(supertypes: ["activity"])` indexada no OpenSearch (740k+ itens). |
| **TypeScript TS2551 / TS2339 no Engine TRI** | Propriedades `descriptorId` e `accuracyPercentage` foram usadas em vez de `descriptorCode` e `accuracyPct`. | Ajuste estático nas linhas 1054-1061 de `PedagogicalTriEngine.ts`. |
| **Falha de Aspas no PowerShell** | Comandos `python -c "..."` com aspas duplas internas quebraram no terminal do Windows. | Criação mandatória de scripts `.py` em `scripts/` e execução via `python scripts/<nome>.py`. |
| **Quota 429 com Modelos Pesados** | Lançamento simultâneo de múltiplos subagentes grandes esgotou a cota. | Execução sequencial ou script local Python para tarefas de mineração e análise de dados. |

---

## 📋 7. Cronologia & Mapa de Tópicos das 121 Conversas

### Distribuição Temática
- **Arquitetura & Electron**: 49 conversas envolvidas (01635779, 0521b18b, 0ca3a044, 350ed794, 5e5051cb, 6221e7e8, 6465e482, 7e6fcf4c, 8f00a1a1, 9c20b7f7...)
- **Portais EdTech & REA**: 61 conversas envolvidas (01635779, 0521b18b, 0ca3a044, 1c91698b, 3b81de59, 4819ec0b, 4cfdad9e, 6221e7e8, 6465e482, 6a086de8...)
- **Governança, LGPD & Leis**: 30 conversas envolvidas (0521b18b, 0ca3a044, 1c91698b, 6221e7e8, 8f00a1a1, 9c20b7f7, b5b7811a, c2270ba1, e3ed4bfd, f0dd2184...)
- **Rede P2P & Resiliência**: 14 conversas envolvidas (0521b18b, 0ca3a044, 1c91698b, 350ed794, 6221e7e8, 8f00a1a1, 9fd59432, c2270ba1, e3ed4bfd, f0dd2184...)
- **Biometria & Visão Edge**: 27 conversas envolvidas (0adf41e8, 0ca3a044, 1c91698b, 4819ec0b, 4cfdad9e, 5e5051cb, 6221e7e8, 6465e482, 6a086de8, 8f00a1a1...)
- **Pedagogia, TRI & BNCC**: 28 conversas envolvidas (0ca3a044, 1c91698b, 4819ec0b, 6221e7e8, 6465e482, 8346bf0f, 8f00a1a1, b5b7811a, c2270ba1, e3ed4bfd...)
- **GPU & Treinamento Colab A100**: 12 conversas envolvidas (1c91698b, 4cfdad9e, 6221e7e8, 6465e482, c2270ba1, e3ed4bfd, f4868028, 5fca40fa, 4ff397bc, 22ed037c...)
- **Gamificação & Cosméticos**: 4 conversas envolvidas (8f00a1a1, efd9918e, 5fca40fa, fd37c70b...)

### Amostra de Marcos Históricos (Sessões Principais)
| Conversa | Data | Pedido / Foco do Usuário | Resultado Entregue |
| :--- | :---: | :--- | :--- |
| `01635779` | Data desco | Sessão automatizada ou subagente | 5 artefatos gerados (0 turnos) |
| `0ca3a044` | Data desco | Sessão automatizada ou subagente | 44 artefatos gerados (0 turnos) |
| `3b81de59` | Data desco | Sessão automatizada ou subagente | 3 artefatos gerados (0 turnos) |
| `5e5051cb` | Data desco | Sessão automatizada ou subagente | 3 artefatos gerados (0 turnos) |
| `6a086de8` | Data desco | Sessão automatizada ou subagente | 3 artefatos gerados (0 turnos) |
| `8049c7b2` | Data desco | Sessão automatizada ou subagente | 3 artefatos gerados (0 turnos) |
| `8f00a1a1` | Data desco | Sessão automatizada ou subagente | 121 artefatos gerados (0 turnos) |
| `b5b7811a` | Data desco | Sessão automatizada ou subagente | 20 artefatos gerados (0 turnos) |
| `cc865427` | Data desco | Sessão automatizada ou subagente | 3 artefatos gerados (0 turnos) |
| `efd9918e` | Data desco | Sessão automatizada ou subagente | 3 artefatos gerados (0 turnos) |
| `f4868028` | Data desco | Sessão automatizada ou subagente | 25 artefatos gerados (0 turnos) |
| `b48d8400` | 2026-06-03 | <USER_REQUEST> Investigue as capacidades de descoberta de rede (mesh/peer discovery) no Áquila Pro. Procure por: 1. Qualquer referência a `libp2p`, `m | 0 artefatos gerados (1 turnos) |
| `5ba8bb9e` | 2026-06-04 | <USER_REQUEST> I need to understand the database schema for the Áquila Pro project. Please find and read the following files: 1. The main Database cla | 0 artefatos gerados (1 turnos) |
| `9ea992e8` | 2026-06-10 | <USER_REQUEST> Research the Aquila Pro project at C:\aquila\apps\electron. I need you to analyze the existing database schema and data models. Specifi | 0 artefatos gerados (1 turnos) |
| `2fd2dd68` | 2026-06-19 | <USER_REQUEST> Create a React component called `BimestralFeedbackPanel` at `c:\aquila\apps\electron\src\ui\components\BimestralFeedbackPanel.tsx` and  | 0 artefatos gerados (1 turnos) |
| `35967182` | 2026-06-27 | <USER_REQUEST> como está o MVP? </USER_REQUEST> <ADDITIONAL_METADATA> The current local time is: 2026-06-27T11:18:58-03:00. </ADDITIONAL_METADATA> <US | 3 artefatos gerados (27 turnos) |
| `4ff397bc` | 2026-08-01 | <USER_REQUEST> ok ... leia os arquivos de recuperação de contexto e vamos voltar ao trabalho sobre o aquila </USER_REQUEST> <ADDITIONAL_METADATA> The  | 125 artefatos gerados (2 turnos) |
| `1fdf2e32` | 2026-08-04 | <USER_REQUEST> Audit the complete UI/App structure of the Áquila Pro project. I need: 1. List ALL files recursively in `C:\aquila\apps\` (the main app | 0 artefatos gerados (1 turnos) |
| `9fc3bab5` | 2026-08-04 | <USER_REQUEST> Fetch and analyze the n8n workflows library. Read these URLs and extract ALL workflow names, descriptions, and links: 1. https://n8n.io | 0 artefatos gerados (1 turnos) |
| `d5f2d56a` | 2026-08-04 | <USER_REQUEST> ## Task: Upgrade Sidebar.tsx and TopBar.tsx to Premium Elite Design First, read these files to understand the current implementation: 1 | 0 artefatos gerados (1 turnos) |
| `f5e0bd89` | 2026-08-04 | <USER_REQUEST> ## Task: Upgrade AdminPortal.tsx to a Premium Executive Dashboard First read ALL of these files to understand the current implementatio | 0 artefatos gerados (1 turnos) |
| `a4c7c8b1` | 2026-08-04 | <USER_REQUEST> ## Task: Upgrade ParentPortal.tsx to Premium Elite Design First read these files: 1. `C:\aquila\apps\electron\src\ui\pages\ParentPortal | 0 artefatos gerados (1 turnos) |
| `8cf9dda4` | 2026-08-07 | <USER_REQUEST> Eu sou professor e eu tenho que digitar as notas de duas disciplinas, Física e Oficina Investigativa de Física, nesse site aí que tá ab | 0 artefatos gerados (9 turnos) |
| `4e588bee` | 2026-08-08 | <USER_REQUEST> Analyze the backend services and main process of the Áquila Pro Electron app. Read these key files: 1. C:\aquila\apps\electron\src\main | 0 artefatos gerados (1 turnos) |
| `1a14066d` | 2026-08-08 | <USER_REQUEST> Read the Content Tab section of C:\aquila\apps\electron\src\ui\pages\TeacherDailyReport.tsx. The Content Tab is the section where `acti | 0 artefatos gerados (1 turnos) |

---

## 🎯 8. Diretrizes Permanentes para Próximas Sessões (/compact)

1. **Local-First & Segurança Absoluta:** Nunca exporte bancos de dados, chaves de API ou segredos. Mantenha credenciais no `.env` ou Windows DPAPI.
2. **Validação Contínua de Build:** Toda alteração no Electron deve ser seguida por verificação de tipos e compilação limpa (`npm run build:electron` e `npm run build:renderer`).
3. **Respeito aos Direitos & Governança:** Obras adicionadas ao acervo devem ter ficha de evidência de direitos preenchida no SQLite `acervo_multimodal_archive.db` antes de qualquer uso.
4. **Respostas em Modo Caveman:** Comunicação técnica, sem enrolação, links markdown clicáveis (`file:///`) e métricas objetivas.
