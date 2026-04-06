---
name: Performance Audit Expert
description: Skill especializada em auditoria profunda de performance, memory leaks e concorrência no Electron e SQLite.
---

# Instruções de Uso

Esta skill deve ser ativada quando o usuário solicitar otimização de recursos ou depuração de travamentos.

## Scripts e Ferramentas

- Analisar `process.memoryUsage()` em busca de padrões de crescimento anômalo.
- Verificar locks de banco de dados SQLite em modo WAL.
- Auditar latência de IPC via `SharedArrayBuffer` se aplicável.

## Exemplos

"Antigravity, use a skill performance_audit para analisar o consumo de RAM do Córtex Pedagógico."

## Regras

1. Sempre emitir um relatório no formato Markdown com métricas `Heap`, `RSS` e `External`.
2. Sugerir pontos de `Garbage Collection` manual se o heap exceder 500MB.
