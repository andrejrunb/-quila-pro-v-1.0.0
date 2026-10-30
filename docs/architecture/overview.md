# 🏛️ Áquila Pro — Visão Geral da Arquitetura do Sistema

> **Status:** Ativo & Homologado v2.1  
> **Modelo:** Edge-First Soberano (Electron + React 18 + Node.js + SQLite WAL)  
> **Governança:** LGPD Art. 14 / ECA Digital (Lei 15.211/2025) / Constituição v2.1

---

## 🧭 1. Camadas do Sistema

```mermaid
flowchart TD
    subgraph UI["Interface do Usuário (Electron Renderer)"]
        P1["Portal do Aluno (Gamificação/RPG/BNCC)"]
        P2["Portal do Docente (Aulas/Kumon/TRI)"]
        P3["Portal da Coordenação & Direção"]
        P4["Portal da Secretaria / RH / Financeiro"]
        P5["Portal de Segurança & Câmeras Edge"]
        EB["ErrorBoundary Resiliente (Anti-Freeze)"]
    end

    subgraph Core["Control Plane & Roteamento (P0/P1)"]
        RR["RouteRegistry.ts (Contrato Canônico Tipado)"]
        ACP["AgentControlPlane.ts (Idempotência & Ledger)"]
    end

    subgraph Main["Electron Main & Serviços de Borda"]
        IPC["Canais IPC Seguros (invoke / handle)"]
        DB["SQLite aquila.db (Modo WAL + AES-256)"]
        NPU["Workers Edge (NPU 26 TOPS / InsightFace 512-D)"]
    end

    UI --> RR
    RR --> EB
    EB --> IPC
    IPC --> Core
    Core --> Main
```

---

## 🔒 2. Princípios de Segurança e Soberania de Dados

1. **Zero Vazamento de Dados de Menores:** Nenhum dado biométrico, identificador de estudante ou mídia deixa o ambiente edge local em modo de desenvolvimento ou produção.
2. **Ambiente de Testes Sintético:** Testes unitários e E2E operam exclusivamente com *fixtures* sintéticas (`demo_student_001`, `aluno_demo`).
3. **Resiliência Térmica e de Execução:** Proteção ativa anti-congelamento via `ErrorBoundary` global e auto-throttling térmico.
