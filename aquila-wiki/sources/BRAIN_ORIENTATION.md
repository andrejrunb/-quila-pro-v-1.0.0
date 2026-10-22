# 🦅 Áquila Pro — Projeto Brain Orientation (v1.5.0)

Este documento é a Referência Mestra para o sistema de Inteligência RAG do Áquila Pro. Ele define a arquitetura, a essência técnica e os protocolos operacionais do "Sovereign OS".

---

## 🏛️ 1. Visão Geral e Identidade
O Áquila Pro é um **Sovereign Educational OS**. Diferente de EdTechs tradicionais baseadas apenas em banco de dados na nuvem, o Áquila é "Agent-First" e "Edge-Native".

- **Missão**: Eliminar a evasão escolar, garantir segurança patrimonial via IA e automatizar a gestão pedagógica/financeira com soberania total de dados.
- **Filosofia Soberana**: O processamento pesado de IA (visão, biometria) ocorre localmente no **Áquila Edge Hub**, protegendo a privacidade (LGPD).

---

## 🏗️ 2. Arquitetura Dual-Core
O ecossistema opera em dois núcleos independentes e sincronizados:

### A. Cloud SaaS (Next.js/T3 Stack)
- **Localização**: `/apps/web`
- **Responsabilidade**: Portais de pais, alunos e RH. Gestão de pagamentos (PIX), faturamento e BI consolidado.
- **Tecnologia**: Next.js, tRPC, PostgreSQL (Neon), Tailwind.

### B. Antigravity Kernel (Electron/Edge)
- **Localização**: `/apps/electron`
- **Responsabilidade**: Controle local da escola, câmeras (RTSP), NPU 26 TOPS, biometria offline.
- **Tecnologia**: Electron (TypeScript), SQLite (WAL Mode), Python Workers (IA Vision).

---

## 🧠 3. O Sistema de Inteligência (Córtex)
A inteligência do Áquila não é apenas um prompt; é uma rede relacional.

- **Córtex Logic**: Motor central no Electron que orquestra tarefas.
- **Sovereign Knowledge Graph (SKG)**: Memória relacional baseada em grafos para entender conexões entre alunos, eventos e comportamentos.
- **BM25 Search**: Indexação de logs e documentos locais para resposta rápida.
- **Gemini Hybrid Nexus**: Integração com Google AI Studio (Gemini 1.5 Pro) para análises multimodais profundas e auxílio pedagógico avançado.

---

## 🛡️ 4. Governança e Agentes
O sistema é gerido por um enxame de agentes especializados regidos pelo manifesto [AGENTS.md](./AGENTS.md):

- **Agente Hub (Security)**: Monitora perímetros e alertas de pânico.
- **Agente Pedagógico**: Analisa padrões de notas e sugere intervenções preventivas.
- **Agente Financeiro**: Garante a saúde do fluxo de caixa escolar.
- **Protocolo MCP (Model Context Protocol)**: Barramento que permite que agentes utilizem ferramentas (câmeras, DB, Sensores) de forma autônoma.

---

## 🎨 5. Design System Elite (orientação Stitch)
O Áquila utiliza o **Elite Design System**, agora alinhado com o **Google Stitch**.
- **Tokens**: Vidro (Glassmorphism), Glow, Paletas HSL dinâmicas.
- **Princípios**: Interfaces "vívidas" e responsivas que transmitem premiumness e segurança.
- **Referência**: `apps/electron/src/index.css` e [DESIGN.md](./DESIGN.md).

---

## 🔄 6. Ciclo de Aprendizado (Self-Study)
O Áquila possui o **Córtex Evolution**, que realiza ciclos de "Self-Study" noturnos:
1.  **Analisa**: Revisa logs de sucesso/falha do dia.
2.  **Sintetiza**: Cria novos Knowledge Items (KIs).
3.  **Sugere**: Propõe melhorias arquiteturais ou alertas preventivos para a diretoria.

---

> [!NOTE]
> Este material de orientação deve ser carregado como a primeira fonte no NotebookLM para habilitar o suporte de nível especialista no desenvolvimento do Áquila Pro.
