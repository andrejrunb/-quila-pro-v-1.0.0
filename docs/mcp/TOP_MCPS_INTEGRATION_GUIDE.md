# 🌐 Áquila Pro — Top MCPs Integration & Architecture Guide (2026 Edition)

Este guia consolida a engenharia reversa (**REA & Agent Reach**) do diretório oficial **`top-mcps.com`** (catálogo 2026 de 406 servidores MCP verificados), filtrando e instrumentando as ferramentas de maior impacto operacional para o ecossistema **Áquila Pro** (Desktop Electron, Redes Neurais Colab A100, Bancos SQLite/Vetoriais e Automação de Agentes).

---

## 🧭 1. Visão Geral da Extração e Taxonomia

A auditoria via Chrome DevTools MCP e inspeção estrutural revelou os endpoints de máquina abertos:
- `/api/mcps.json`: Catálogo completo estruturado com comandos de instalação (`uvx`, `npx`, `docker`) e requisitos de ambiente.
- `/llms.txt` & `/llms-full.txt`: Documentação limpa em formato de LLM contexts.
- `/schema/directory.json`: Metadados e taxonomias de clientes.

### Classificação Estratégica para o Áquila Pro
Dos 406 servidores avaliados, foram selecionados **25 servidores prioritários** organizados em 5 domínios operacionais:

```mermaid
flowchart TD
    subgraph Core["Córtex Áquila Pro"]
        AG["Antigravity / Electron Agent"]
    end

    subgraph DevTools["1. Developer & Codebase Tools"]
        C7["Context7\n(@upstash/context7-mcp)"]
        GH["GitHub MCP\n(github-mcp-server)"]
        SN["Sentry MCP\n(@sentry/mcp-server)"]
    end

    subgraph Storage["2. Bases de Dados & Vetores"]
        PG["Postgres MCP Pro\n(crystaldba/postgres-mcp)"]
        SQL["SQLite Local\n(server-sqlite)"]
        QD["Qdrant / Chroma\n(Vetores Locais)"]
    end

    subgraph Orchestration["3. Memória & Raciocínio"]
        BM["Basic Memory\n(Markdown Knowledge Graph)"]
        ST["Sequential Thinking\n(server-sequentialthinking)"]
    end

    subgraph Automation["4. Navegação & Coleta Web"]
        FC["Firecrawl MCP\n(Scraping Estruturado SPA)"]
        TV["Tavily / Brave Search\n(Web Search RAG)"]
        PW["Playwright MCP\n(E2E Headless)"]
    end

    AG --> DevTools
    AG --> Storage
    AG --> Orchestration
    AG --> Automation
```

---

## ⚡ 2. Os 5 Servidores MCP de Maior Impacto Operacional

### 1. Context7 (`@upstash/context7-mcp`)
- **Papel:** Puxa documentação atualizada e trechos de código oficiais de bibliotecas diretamente para o contexto do agente sem alucinações de versões legadas.
- **Instalação:** `npx -y @upstash/context7-mcp`
- **Variáveis de Ambiente:** Nenhuma (zero-config).
- **Uso no Áquila:** Atualização imediata sobre breaking changes em Next.js 15, Vite 6, Tailwind CSS v4 e APIs do Electron 30+.

### 2. Postgres MCP Pro (`postgres-mcp`)
- **Papel:** Analisador avançado de desempenho de banco de dados com `EXPLAIN ANALYZE`, consultor automático de índices e diagnóstico de locks.
- **Instalação:** `uvx postgres-mcp`
- **Variáveis de Ambiente:** `DATABASE_URI="postgresql://usuario:senha@localhost:5432/aquila_prod"`
- **Uso no Áquila:** Otimização de consultas relacionais pesadas de desempenho de alunos, séries temporais e telemetria institucional.

### 3. Basic Memory (`basic-memory`)
- **Papel:** Memória e grafo de conhecimento local-first armazenado em arquivos Markdown legíveis por humanos e editáveis por agentes.
- **Instalação:** `uvx basic-memory mcp`
- **Variáveis de Ambiente:** `BASIC_MEMORY_PROJECT="aquila_knowledge_vault"`
- **Uso no Áquila:** Registro persistente de preferências da escola, histórico de intervenções pedagógicas e convenções do time de engenharia.

### 4. Firecrawl MCP (`firecrawl-mcp`)
- **Papel:** Crawler inteligente que converte páginas web complexas e dinâmicas (SPAs) em Markdown limpo para LLMs.
- **Instalação:** `npx -y firecrawl-mcp`
- **Variáveis de Ambiente:** `FIRECRAWL_API_KEY="..."`, `FIRECRAWL_API_URL="https://api.firecrawl.dev"`
- **Uso no Áquila:** Extração e monitoramento de novos editais de vestibulares (ENEM, FUVEST, UNICAMP) e portais de conteúdo acadêmico.

### 5. Tavily MCP (`tavily-mcp`)
- **Papel:** Busca web hiperotimizada para LLMs, entregando snippets sintetizados com citações diretas e eliminando páginas de login e poluição de cookies.
- **Instalação:** `npx -y tavily-mcp`
- **Variáveis de Ambiente:** `TAVILY_API_KEY="..."`
- **Uso no Áquila:** Pesquisa rápida de gabaritos oficiais, bibliografias e alinhamentos da Base Nacional Comum Curricular (BNCC).

---

## 💻 3. Configurações Prontas para Clientes (Recipes)

### A. Claude Desktop (`%APPDATA%\Claude\claude_desktop_config.json`)
```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    },
    "postgres-pro": {
      "command": "uvx",
      "args": ["postgres-mcp"],
      "env": {
        "DATABASE_URI": "postgresql://postgres:secret@localhost:5432/aquila_db"
      }
    },
    "basic-memory": {
      "command": "uvx",
      "args": ["basic-memory", "mcp"],
      "env": {
        "BASIC_MEMORY_PROJECT": "aquila-core"
      }
    },
    "tavily": {
      "command": "npx",
      "args": ["-y", "tavily-mcp"],
      "env": {
        "TAVILY_API_KEY": "tvly-YOUR_KEY_HERE"
      }
    },
    "firecrawl": {
      "command": "npx",
      "args": ["-y", "firecrawl-mcp"],
      "env": {
        "FIRECRAWL_API_KEY": "fc-YOUR_KEY_HERE"
      }
    }
  }
}
```

### B. Cursor (`.cursor/mcp.json`)
```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    },
    "postgres-pro": {
      "command": "uvx",
      "args": ["postgres-mcp"],
      "env": {
        "DATABASE_URI": "postgresql://postgres:secret@localhost:5432/aquila_db"
      }
    },
    "sentry": {
      "command": "npx",
      "args": ["-y", "@sentry/mcp-server"],
      "env": {
        "SENTRY_AUTH_TOKEN": "YOUR_TOKEN",
        "SENTRY_ORG": "aquila-edtech"
      }
    }
  }
}
```

---

## 🔒 4. Soberania Local & Governança (LGPD Art. 14 / Constituição Áquila)

1. **Chaves de API Cifradas:** Tokens de serviços externos (`TAVILY_API_KEY`, `FIRECRAWL_API_KEY`) devem ser injetados exclusivamente via variáveis de ambiente do sistema ou protegidos via Windows DPAPI / `.env.local` protegido por `.gitignore`.
2. **Zero Exfiltração de Dados de Alunos:** Nenhum MCP externo (Context7, Tavily, Sentry) pode receber nomes, matrículas ou biometria facial de alunos em seus prompts ou payloads.
3. **Persistência Offline:** O servidor `basic-memory` e os bancos SQLite mantêm seus arquivos estritamente no disco local (`c:\aquila\...`), garantindo funcionamento contínuo e conformidade regulatória.
