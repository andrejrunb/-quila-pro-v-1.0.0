# Áquila Pro — Protocolo de Operação Autônoma (30 Dias)

Este documento rege a execução diária autônoma do agente no ecossistema Áquila Pro, com gestão otimizada de tokens e resiliência de hardware.

## 📅 Configuração do Agendamento (Daemon Cron)
- **Frequência**: Diário às 03:00 AM (Horário Local)
- **Duração**: 30 dias (30 iterações)
- **Modo**: Standing Daemon Job (Persistente no Antigravity)
- **Task ID Ativa**: `task-5404`

---

## ⚡ Diretrizes de Gestão de Tokens & Desempenho

### 1. Modo Caveman (Compressão Severa de Contexto)
- Todas as saídas de auditoria e logs intermediários devem ser resumidos em tabelas curtas e markdown direto.
- Respostas dispensam saudações ou explicações prolixas — foco 100% técnico.
- Limite de saída por iteração: ~500 tokens para preservar a janela de contexto.

### 2. Auto-Throttling de Hardware (Resiliência Áquila Edge)
- Pausar inferências intensivas se a temperatura da NPU/CPU exceder 75ºC.
- Executar builds em modo sequencial para não estressar a memória RAM.

---

## 📋 Checklist Diário da Rotina (Status: Dia 1/30 — Ok)

```
[x] 1. VERIFICAÇÃO DE CÓDIGO (Type-Check & Lints) — 0 erros
    ├── Electron App (apps/electron): PASSED
    └── Web SaaS App (apps/web): PASSED

[x] 2. SAÚDE DE INFRAESTRUTURA (Docker Services) — 100% UP
    ├── Evolution API v2 (port 8080): UP (4h+)
    ├── n8n Workflow Engine (port 5678): UP (4h+)
    └── Postgres 15 (port 5432): UP (5h+)

[x] 3. SEGURANÇA E LGPD — PASS
    ├── Sanitização PII local mantida
    └── Integridade da matriz de governança verificada

[x] 4. BACKUP SOBERANO — PASS
    └── Bases SQLite/Postgres prontas e ativas

[x] 5. ATUALIZAÇÃO DO STATUS — COMPLETED
    └── Log do Dia 1/30 registrado
```

---
*Assinado: Córtex Central v2.0.0 — Protocolo Autônomo 30 Dias*
