# Áquila Pro — Guia de Desenvolvimento

Este arquivo centraliza padrões e comandos essenciais para o desenvolvimento do projeto.

## Comandos de Build & Execução

### aquilapro_electron (Frontend / Desktop)

- `npm run dev` — Inicia o ambiente de desenvolvimento Electron com Hot Reload.
- `npm run build` — Gera o build de produção do React.
- `npm run package` — Empacota a aplicação Windows (.exe).
- `npx tsc --noEmit` — Verificação de tipos TypeScript.

### aquila-cloud (Backend / Cloud)

- `npm run dev` — Inicia servidor com nodemon + ts-node.
- `npm run build` — Compila TypeScript para JS.
- `npm start` — Executa o servidor compilado.
- `npx tsc --noEmit` — Verificação de tipos.

## Testes

- `npm test` — Executa suite de testes Jest.
- `npx cypress open` — Executa testes E2E (se configurado).

## Estilo de Código & Regras

- **Linguagem:** TypeScript (obrigatório).
- **Semântica:** Use componentes funcionais e Hooks no React.
- **Estilização:** CSS Vanilla ou CSS Modules. Evite Tailwind a menos que solicitado.
- **Segurança (LGPD):** Jamais envie dados sensíveis (fotos, CPF, biometria) via logs ou APIs de terceiros não criptografadas.
- **Nomenclatura:** PascalCase para componentes, camelCase para funções/variáveis, SCREAMING_SNAKE_CASE para constantes.

## Estrutura do Projeto

- `src/ui/` — Componentes React.
- `src/services/` — Lógica de negócio e integrações.
- `src/database/` — Camada de persistência (SQLite/Drizzle).
- `resources/` — Assets estáticos e scripts de instalador.

## Skills Adotadas (Agentic)

- **Superpowers (obra):** Conjunto de ferramentas avançadas para automação e análise.
- **UI-UX Pro Max (nextlevelbuilder):** Referência para design de elite, animações fluidas e Glassmorphism.
- **n8n-mcp (czlonkowski):** Integração com workflows n8n via MCP.
- **Get Shit Done (gsd-build):** Metodologia e scripts para execução rápida de tarefas.
- **Awesome Claude Code (hesreallyhim):** Melhores práticas e prompts para codificação assistida.
- **Obsidian Skills (kepano):** Fluxos de trabalho e organização de conhecimento para agentes.
- **Localização:** `skills/` na raiz do projeto.

## Integração WhatsApp (Evolution API)

- Webhook configurado em `aquila-cloud` em `/whatsapp/webhook`.
- Respostas via Gemini 2.0 Flash Geradas com contexto de sistema filtrado por LGPD.
- Comando `nota: <texto>` ou `/nota <texto>` via WhatsApp para salvar notas rápidas na nuvem.
