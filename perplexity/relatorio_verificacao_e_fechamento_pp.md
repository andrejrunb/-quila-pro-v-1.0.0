# Relatório de Verificação e Fechamento — Pasta `perplexity/` (Missão Consolidada PP v2.1.1)

**Data de Execução:** 05 de Novembro de 2026 (`America/Sao_Paulo`)  
**Repositório:** `c:\aquila`  
**Status de Governança:** Verificações de bancada concluídas com sucesso. Commits e pushes para as branches `main` e `integration/stabilization-and-quarantine` efetuados com autorização explícita da usuária (*Human-in-the-Loop*).

---

## 1. Tríade de Rastreabilidade e Identidade Criptográfica

Para assegurar total transparência e reprodutibilidade, os artefatos e evidências estão formalmente vinculados à seguinte **Tríade de Commits**:

```text
source_commit:        0612be71f307399e2bc8d31fe1dc71e9a7e37e9d
                      (Build do código-fonte, empacotamento do executável e app.asar)

evidence_commit:      050b3ce92bf18b3874134be1086a2e411f16da0a
                      (Execução de bancada, validação em PATH limpo e relatórios JSON gerados)

documentation_commit: HEAD (Sincronizado em origin/main e origin/integration/stabilization-and-quarantine)
                      (Dossiê v2.1.1, plano executivo, manifesto SHA256SUMS e restore_edge.bat)
```

> **Nota de Imutabilidade Criptográfica:** Os arquivos binários de distribuição (`Aquila Pro.exe` e `resources/app.asar`) foram gerados no `source_commit` e permaneceram **100% inalterados** nos commits de evidência e documentação, conforme atestado pelos hashes SHA-256 no manifesto [`SHA256SUMS_H01_CANDIDATE.txt`](./SHA256SUMS_H01_CANDIDATE.txt):
> - `Aquila Pro.exe`: `F087E4B45834D8DAECBF88DD61B0A2757AB836B8A1891C16CA0AAB321E5D7EBB`
> - `resources/app.asar`: `270A6696E7A8EDFD4DCD3FA198DBCE2D0D0E40847E52EDB41BE0FCDA934B2445`
> - `better_sqlite3.node`: `AD19705C7938A60EF5557E31D152843CC42364684913847FBD623484430283A3`
> - `restore_edge.bat`: `D953416D52AD78E2B8ABF1A81661E9AFC06CE1F88B15D55C9E4D7A44136F48D3`

---

## 2. Tabela Consolidada Item a Item (Itens 1 a 12 da Missão)

| Item | Escopo da Missão | Estado Inicial Encontrado | Status Final | Resumo da Evidência |
| :---: | :--- | :---: | :---: | :--- |
| **1** | Identificar versão de trabalho e preservar alterações | `implementado` | **Concluído** | Sincronizado nas branches `main` e `integration/stabilization-and-quarantine`. Zero alterações destrutivas em bancos reais. |
| **2** | Escopo curricular do estudante e autorização (Frontend + IPC) | `parcial` | **Concluído** | `studentGradeScope.ts` bloqueia contexto ausente/inválido (`UNVERIFIED`), rejeita prefixo BNCC amplo sem série exata e aplica autorização nos handlers IPC (`handlers.ts`). |
| **3** | Datas e períodos (`America/Sao_Paulo`, sem `'Recente'`) | `parcial` | **Concluído** | `DEFAULT_SCHOOL_TIMEZONE = 'America/Sao_Paulo'`, `getSchoolTodayIsoDate`, `formatSafeDatePtBr` (bloqueia `'Recente'`) e parser ISO estrito. |
| **4** | Prévia de portais vs. sessão real | `parcial` | **Concluído** | `resolvePortalPreviewState` em `PortalLayout.tsx` exibe sessão real + badge `Modo de Prévia (Somente Leitura)` e bloqueia escrita (`PREVIEW_READ_ONLY`). |
| **5** | Notas, médias e recuperação (`TeacherGradebook.tsx`) | `parcial` | **Concluído** | Regra versionada `REGRA-AVAL-2026.1`: nota vazia retorna `null`, média acumulada não divide por bimestres futuros e modal de confirmação ao sair sem salvar. |
| **6** | Frequência e diário (`AttendanceCall.tsx` + `Diary.tsx`) | `pendente` | **Concluído** | 4 estados, chamada rápida em < 90s (`Ctrl+Shift+C`), ação em lote com `Desfazer`, sincronia com `Diary.tsx` e biometria desabilitada para H-01. |
| **7** | Citação de Marie Curie e gate editorial | `parcial` | **Concluído** | Omitida citação sem fonte primária em `historicalPersonas.ts`, mantendo nota biográfica factual (`1867–1934, Nobel de Física 1903 e Química 1911`). |
| **8** | Tokens CSS e redesign nas telas prioritárias | `parcial` | **Concluído** | Corrigidos `LoginPage.tsx`, `ReceptionPortal.css`, `PortalLayout.tsx`, `SeatingIntelligence.tsx`, `TeacherGradebook.tsx`, `AttendanceCall.tsx` e `StudentRPGPortal.tsx`. |
| **9** | Coletor de documentos e proteção SSRF em redirects | `parcial` | **Concluído** | Adicionados `is_safe_ip_address`, `SafeRedirectHandler` e `validate_candidate_document_bytes`. Aprovado em 10/10 fixtures (`collector_10_fixtures_report.json`). |
| **10** | Harness PC e inferência local (`max_steps=8`) | `pendente` | **Concluído** | Implementado `scripts/colab_harness/aquila_colab_harness.py` e validado em 8/8 checks contra simulador local `/v1/chat/completions` (`colab_harness_verification_report.json`). |
| **11** | Reconciliar documentação H-01 em `perplexity/` | `parcial` | **Concluído** | Atualizados `dossie_homologacao_h01_final.md` (v2.1.1), `plano_executivo_homologacao_h01.md` e `SHA256SUMS_H01_CANDIDATE.txt` com matriz unificada de DR, delimitação estrita de 1 turma (30 alunos) em campo e gates G1 a G5. |
| **12** | Entregável final e registro de governança | `pendente` | **Concluído** | Entregáveis commitados e sincronizados no GitHub com permissão explícita. |

---

## 3. Matriz Unificada de DR e Script Autônomo (`restore_edge.bat`)

O procedimento autônomo de restauração para ambientes de produção foi consolidado no script [`scripts/restore_edge.bat`](../scripts/restore_edge.bat) e embutido no pacote portátil [`apps/electron/release_v2_2/win-unpacked/restore_edge.bat`](../apps/electron/release_v2_2/win-unpacked/restore_edge.bat).

- **Zero Dependências:** Utiliza exclusivamente comandos nativos do Windows (`cmd.exe` e `certutil`).
- **Pré-validação de Truncamento:** Aborta imediatamente antes do swap se o arquivo for inválido (código de saída 3).
- **Snapshot Automático de Rollback:** Grava cópia completa de `aquila.db`, `wal` e `shm` antes de qualquer alteração física.
- **Rollback Imediato:** Em caso de erro na substituição, restaura o snapshot instantaneamente (RTO < 2s).

---

## 4. Comandos Executados e Resultados Reais de Bancada

| Comando Executado | Resultado | Relatório Gerado |
| :--- | :---: | :--- |
| `powershell -ExecutionPolicy Bypass -File scripts/h01/test_clean_runtime.ps1` | **PASS (Clean PATH, PID ativo, 202 MB RAM)** | [`test-results/clean_runtime_h01_evidence.json`](../test-results/clean_runtime_h01_evidence.json) |
| `node scripts/h01/test_h01_8_operational_priorities.cjs` | **PASS (8/8 Prioridades Operacionais)** | [`test-results/h01_8_operational_priorities_report.json`](../test-results/h01_8_operational_priorities_report.json) |
| `node scripts/h01/test_pp_mission_verification.cjs` | **PASS (12/12 Verificações da Missão PP)** | [`test-results/pp_mission_verification_report.json`](../test-results/pp_mission_verification_report.json) |
| `python scripts/h01/test_collector_10_fixtures.py` | **PASS (10/10 fixtures sintéticas)** | [`test-results/collector_10_fixtures_report.json`](../test-results/collector_10_fixtures_report.json) |
| `python scripts/colab_harness/test_colab_harness.py` | **PASS (8/8 checks — Simulador Local)** | [`test-results/colab_harness_verification_report.json`](../test-results/colab_harness_verification_report.json) |
| `pnpm --filter @aquila/web run lint` | **PASS (0 erros, 0 warnings)** | Console log |
| `pnpm --filter @aquila/web run test` | **PASS (8 test files, 30/30 testes)** | Console log |
| `pnpm --filter @aquila/api run test` | **PASS (1 test file, 5/5 testes)** | Console log |

---

## 5. Próximas Etapas no Ambiente Presencial (Mundo Físico)

1. **Validação em Máquina Windows Limpa Física (`E-01`):**  
   O teste de bancada com PATH sanitizado foi aprovado (`clean_runtime_h01_evidence.json`). A homologação definitiva requer a execução na estação física dedicada da escola (sem Node/Git instalados).
2. **Cumprimento dos Gates G1 a G5 e Aceite Formal (`E-02`):**  
   Reunião presencial para conferência da ata de homologação da candidata v2.1.0 e assinatura conjunta das lideranças (Direção Escolar, DPO da instituição e TI).
3. **Importação Restrita da Turma Piloto (Gate G4):**  
   Apenas os dados da turma piloto selecionada (até 30 alunos) serão importados para a operação assistida de 1 semana.

---

*Elaborado para homologação presencial. Aceite operacional pendente das assinaturas formais identificadas nesta versão (Direção Escolar, DPO e TI).*
