---
tags: [rbac, lgpd, security, database]
title: Matriz de Permissões do Áquila OS
date: 2026-03-31
---

# Matriz Oficial de Acesso (LGPD Compliance)

A tabela governa a UI visual do Front-End React.

| Módulo/Feature                 | Administrador Geral | RH/Secretaria | Coordenação | Docente | Pais/Alunos |
|--------------------------------|---------------------|---------------|-------------|---------|-------------|
| **Setup de Totem/Hardwares**   | ✅ Full              | ❌ Block       | ❌ Block     | ❌ Block | ❌ Block     |
| **Gerador de Grades (AI)**     | ✅ Full              | ✅ Full        | 👁 Read     | ❌ Block | ❌ Block     |
| **Fila de Moderação IA (NLP)** | ✅ Audit             | ❌ Block       | ✅ Modera    | ❌ Block | ❌ Block     |
| **Diário de Faltas Automático**| ✅ Read              | ❌ Block       | ✅ Modera    | ✅ Edita | 👁 Read-Self |
| **Logs de Evasão (Corredor)**  | ✅ Alarme            | ❌ Block       | ✅ Atua      | ❌ Block | ❌ Block     |

*(👁 Read = Apenas Lê | ✅ = Atua/Executa | ❌ Block = Componentes Ocultos no Electron).*
