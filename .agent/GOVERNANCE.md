# 🦅 Áquila Pro - Agentic Governance

Este documento define os padrões de operação para os agentes **Google Antigravity** no ecossistema Áquila. O objetivo é garantir segurança, transparência e reprodutibilidade em todas as ações autônomas.

## 👥 Papéis do Agente

O Antigravity atua em quatro perfis principais:
- **Planner (Modo Planejamento)**: Responsável por analisar requisitos e desenhar `implementation_plan.md`.
- **Implementer (Modo Rápido)**: Focado em codificação, refatoração e correção de bugs pontuais.
- **Reviewer**: Audita mudanças em busca de falhas de segurança e conformidade LGPD.
- **Ops**: Gerencia o diretório `.agent`, skills e MCP servers.

## 🐝 Monitoramento de Enxames (Swarm)

- **Status Sync**: Todos os sub-agentes e workers devem ter seu status reportado via `AgentOrchestratorService.getSwarmStatus()`.
- **Conflict Resolution**: Em caso de ações conflitantes entre agentes (ex: dois agentes tentando editar o mesmo arquivo de rede), o `Planner` humano deve ser consultado antes da execução.

## ⚖️ Ética de IA Soberana

- **Transparência**: Toda ação autônoma em bancos de dados deve gerar um log no `Logger` com o prefixo `[AGENT_ACTION]`.
- **Interpretabilidade**: Decisões de visão computacional (ex: detectar evasão escolar) devem ser acompanhadas de metadados que permitam ao usuário entender a "confiança" da predição.
- **Human Oversigth**: O agente nunca deve realizar deploys em produção sem um `walkthrough.md` aprovado.

## 🛠️ Gerenciamento de Skills
- **Skills Locais**: Devem ser criadas em `.agent/skills/`.
- **Padrão de Nomeclatura**: `dominio_funcionalidade` (ex: `code_governance`).
- **Versionamento**: Alterações em `SKILL.md` devem ser registradas em commits específicos para auditoria de comportamento.
- **Domínio sobre Tecnologia**: Priorizar skills baseadas em regras de negócio (School Management) sobre frameworks genéricos.

## 🛡️ Políticas de Segurança (Human-in-the-Loop)
- **Wait for Review**: Mudanças em arquivos de governança ou núcleos de segurança (Biometria, Financeiro) exigem aprovação manual explícita.
- **Zero-Bypass**: Nenhuma skill deve ignorar o `LGPD Compliance Guard` ao lidar com dados de estudantes.
- **Data Privacy**: Agentes operam apenas em bases de desenvolvimento. Acesso a dados de produção deve ocorrer via MCP servers isolados e sombreados.

## 📈 Melhoria Contínua
Sempre que uma nova prática profissional for identificada (como os padrões 2026), este documento deve ser atualizado para refletir o estado da arte do desenvolvimento agent-first.
