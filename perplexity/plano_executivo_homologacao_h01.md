# Plano Executivo de Homologação H-01 — Áquila Pro

Este plano estabelece os testes práticos e evidências necessárias para liberação do Piloto H-01 na máquina de bancada, em conformidade com o manifesto Áquila Pro.

---

## 🎯 Escopo Estrito H-01

### O que está no escopo:
- Instalação Windows limpa (nó único, sem dependência de ferramentas de desenvolvimento).
- Jornada pedagógica completa via UI/IPC (Secretaria → Professor → Aluno → Intervenção).
- Recuperação transacional SQLite (Atomic Journal, WAL, integridade física e crash recovery).
- Segurança de login, autorização RBAC, proteção de rotas e mitigação de vulnerabilidades de rede (`private-ip`).
- Backup agendado, detecção de falha de destino e preservação de dados em atualização.
- Protocolo de contingência operacional e matriz de aceite humano (HITL).

### O que está explicitamente desativado/quarentenado (Fora do H-01):
- **Mesh / P2P**: Desativado por padrão via feature flag (`AQUILA_ENABLE_MESH=false`), eliminando superfície de ataque do `private-ip`.
- **LoRA / Colab A100**: Processamento local soberano apenas; nenhum dado escolar trafega para cloud.
- **Biometria / Catraca Física (H02-02)**: Fora do escopo do piloto pedagógico H-01.
- **Calibração TRI por LLM / Geração Autônoma de Mídia**: Desativados em produção.

---

## 📋 Três Blocos Práticos de Execução

```mermaid
flowchart TD
    subgraph Bloco1 ["Bloco 1: Bancada Windows & Identidade"]
        B1_1["1.1 Isolamento de Runtime (Clean PATH)"]
        B1_2["1.2 Carregamento better-sqlite3"]
        B1_3["1.3 Fingerprint de Build (SHA-256 / Git SHA)"]
        B1_4["1.4 Atualização e Preservação de Schema"]
    end

    subgraph Bloco2 ["Bloco 2: Jornada Escolar & Segurança"]
        B2_1["2.1 Importação CSV Secretaria"]
        B2_2["2.2 Criação de Atividade pelo Docente"]
        B2_3["2.3 Resolução pelo Aluno"]
        B2_4["2.4 Correção Objetiva e Intervenção"]
        B2_5["2.5 Persistência Pós-Reboot"]
        B2_6["2.6 Desativação do Mesh & Mitigação private-ip"]
        B2_7["2.7 RBAC, Rate Limit & Isolamento"]
    end

    subgraph Bloco3 ["Bloco 3: Operação, Recuperação & Aceite Humano"]
        B3_1["3.1 Crash Recovery & RTO/RPO SQLite"]
        B3_2["3.2 Backup Agendado & Simulação de Falha"]
        B3_3["3.3 Contingência em Papel & Critérios de Parada"]
        B3_4["3.4 Matriz de Assinatura das Lideranças (HITL)"]
    end

    Bloco1 --> Bloco2 --> Bloco3
```

---

## 🛠️ Matriz de Execução e Evidências

| Item | Ação Técnica | Script / Verificador | Evidência Requerida |
| :--- | :--- | :--- | :--- |
| **1. Instalação Limpa** | Executar binário com PATH sanitizado (sem Node/Git) | `scripts/h01/test_clean_runtime.ps1` | Inicialização limpa, native module OK, log sem erros |
| **2. Jornada Escolar** | Fluxo real Secretaria → Professor → Aluno → Intervenção | `scripts/h01/test_e2e_school_journey.ts` | 5 etapas concluídas, banco consistente pós-restart |
| **3. Recuperação SQLite** | Aborto durante escrita e restauração com WAL/SHM | `scripts/h01/test_crash_recovery_dr.ts` | Integridade `ok`, RTO < 2s, RPO = 0 dados corrompidos |
| **4. Segurança & RBAC** | Teste de força bruta, tokens HMAC, roles cruzadas | `scripts/h01/test_auth_security.ts` | Lockout pós 5 falhas, 0 tokens em logs, 403 em cross-role |
| **5. Mitigação `private-ip`** | Feature flag Mesh desligada + interceptor SSRF | `scripts/h01/test_network_target_guard.ts` | Mesh inativo, rejeição de IPs octais/hex/metadados |
| **6. Backup & Falha** | Backup rotineiro + simulação de disco cheio/bloqueado | `scripts/h01/test_backup_operational.ts` | Alerta registrado em auditoria sem travamento do app |
| **7. Schema & Rollback** | Migração e teste de compatibilidade de schema | `scripts/h01/test_schema_migration.ts` | Todos os dados sintéticos mantidos sem perda |
| **8. Aceite Humano** | Termo de homologação e protocolo de contingência | `dossie_homologacao_h01_final.md` | Campos para assinaturas: Pedagógico, Direção, DPO, TI |

