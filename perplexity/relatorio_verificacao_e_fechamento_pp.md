# Relatório de Verificação e Fechamento — Pasta `perplexity/` (Missão Consolidada PP)

**Data de Execução:** 04 de Novembro de 2026 (`America/Sao_Paulo`)  
**Repositório:** `c:\aquila`  
**Status de Governança:** Verificação e correções concluídas localmente; **nenhum `git push`, PR, merge, release ou deploy foi executado**, conforme restrição explícita da missão.

---

## 1. Branch, Commit e Estado Inicial do Repositório

- **Branch ativa:** `integration/stabilization-and-quarantine`
- **Commit `HEAD` de partida:** `fb6f1e7a758d93bac03945e18353f59989cdfe37` (*"docs(perplexity): adiciona especificacao unificada de redesign, escopo por serie, coletor pdf, activesoft e colab harness"*)
- **Commits anteriores correlatos inspecionados:**
  - `871c80f4` — Dossiê final e plano executivo H-01 em `perplexity/`
  - `b0a2daa8` — Redesign inicial do cockpit docente, arena e banners
- **Causa raiz das 6 capturas de tela da usuária:**  
  O executável `C:\aquila\apps\electron\release_v2_2\win-unpacked\Aquila Pro.exe` em execução carregava `resources\app.asar` empacotado em `03/11/2026 22:23` (anterior aos commits de correção) e continha colisão de CSS global (`.input-group` de `ReceptionPortal.css` vazando sobre `LoginPage.tsx`), ausência de compensação de `width`/`minHeight` no `zoom: 60%` de `PortalLayout.tsx` e fotos verticais esticadas (`seat-full-photo`) em `SeatingIntelligence.tsx`.

---

## 2. Tabela Consolidada Item a Item (Itens 1 a 12 da Missão)

| Item | Escopo da Missão | Estado Inicial Encontrado | Status Final | Resumo da Evidência |
| :---: | :--- | :---: | :---: | :--- |
| **1** | Identificar versão de trabalho e preservar alterações | `implementado` | **Concluído** | Branch `integration/stabilization-and-quarantine`, `HEAD` `fb6f1e7a758d93bac03945e18353f59989cdfe37`. Zero alterações destrutivas em bancos reais. |
| **2** | Escopo curricular do estudante e autorização (Frontend + IPC) | `parcial` | **Corrigido nesta rodada** | `studentGradeScope.ts` bloqueia contexto ausente/inválido (`UNVERIFIED`), rejeita prefixo BNCC amplo sem série exata e itens sem metadados, preserva exceção de revisão atribuída por professor (`crossGradeAssignment`) e aplica autorização nos handlers IPC (`handlers.ts`). |
| **3** | Datas e períodos (`America/Sao_Paulo`, sem `'Recente'`) | `parcial` | **Corrigido nesta rodada** | `DEFAULT_SCHOOL_TIMEZONE = 'America/Sao_Paulo'`, `getSchoolTodayIsoDate`, `formatSafeDatePtBr` (retorna `'Data não informada'` para nulos/inválidos e bloqueia `'Recente'`), parser ISO estrito e `classifyDueDateStatus`. |
| **4** | Prévia de portais vs. sessão real | `parcial` | **Corrigido nesta rodada** | `resolvePortalPreviewState` em `PortalLayout.tsx` exibe sessão real + badge `Modo de Prévia (Somente Leitura)`, bloqueia escrita (`PREVIEW_READ_ONLY`) e confina `student`, `parent` e `secretaria` em `App.tsx` e `PortalLayout.tsx`. |
| **5** | Notas, médias e recuperação (`TeacherGradebook.tsx`) | `parcial` | **Corrigido nesta rodada** | Regra versionada `REGRA-AVAL-2026.1`: nota vazia `""` retorna `null` (`PENDING_ENTRY`), média parcial proporcional, média acumulada não divide por bimestres futuros não iniciados, modal de confirmação ao sair sem salvar e histórico de auditoria. |
| **6** | Frequência e diário (`AttendanceCall.tsx` + `Diary.tsx`) | `pendente` | **Corrigido nesta rodada** | 4 estados (`unverified`, `present`, `absent`, `justified`), início como `Não conferido` quando não há chamada salva, ação em lote com contagem + `Desfazer lote`, sincronia bidirecional com `Diary.tsx` e biometria desabilitada para H-01. |
| **7** | Citação de Marie Curie e gate editorial | `parcial` | **Corrigido nesta rodada** | Omitida citação sem fonte primária anexada em `historicalPersonas.ts`, `BNCCSkillTree.tsx` e `SovereignPvPArena.tsx`, mantendo nota factual (`1867–1934, Nobel de Física 1903 e Química 1911`). Gate editorial `validateEditorialQuoteGate` exige `sourceWork`, `sourceLocator` e `verified: true`. |
| **8** | Tokens CSS e redesign nas 4 telas prioritárias + 6 capturas | `parcial` | **Corrigido nesta rodada** | Corrigidos `LoginPage.tsx`, `ReceptionPortal.css`, `PortalLayout.tsx`, `SeatingIntelligence.tsx`, `TeacherPortal.tsx`, `TeacherGradebook.tsx`, `AttendanceCall.tsx`, `StudentRPGPortal.tsx` e `aquila-ui-tokens.css`; recompilado e atualizado `win-unpacked/resources/app.asar`. |
| **9** | Coletor de documentos e proteção SSRF em redirects | `parcial` | **Corrigido nesta rodada** | Adicionados `is_safe_ip_address` (RFC1918/loopback/link-local), `SafeRedirectHandler` e `validate_candidate_document_bytes` em `swarm_continuous_finetune_daemon.py`. Aprovado em 10/10 fixtures (`test_collector_10_fixtures.py`). |
| **10** | Harness PC e inferência no Colab (`max_steps=8`) | `pendente` | **Corrigido nesta rodada** | Implementado `scripts/colab_harness/aquila_colab_harness.py` (configuração por env, bloqueio de `../` e arquivos sensíveis, allowlist sem `shell=True`, persistência/retomada e parada em `max_steps=8`). Validado em 8/8 checks contra simulador local `/v1/chat/completions`. |
| **11** | Reconciliar documentação H-01 em `perplexity/` | `parcial` | **Corrigido nesta rodada** | Atualizados `dossie_homologacao_h01_final.md` e `especificacao_redesign_benchmark_e_colab_harness.md` separando commit vs. instalado, sintético vs. real, preparado vs. assinado, harness local vs. GPU remota e H-01 vs. H-02. |
| **12** | Entregável final e respeito ao bloqueio de push/release | `pendente` | **Concluído** | Este relatório (`perplexity/relatorio_verificacao_e_fechamento_pp.md`) gerado com todas as evidências. Nenhum `git push` ou release executado. |

---

## 3. Lista de Arquivos Alterados ou Criados Nesta Rodada

### Código da Aplicação Electron (`apps/electron/`)
- [`apps/electron/src/App.tsx`](../apps/electron/src/App.tsx) — Importação de `aquila-ui-tokens.css`, sincronização de `aquila_session_user` e confinamento estrito de rotas para `student`, `parent` e `secretaria`.
- [`apps/electron/src/ui/utils/studentGradeScope.ts`](../apps/electron/src/ui/utils/studentGradeScope.ts) — Resolução estrita de série/etapa sem fallback `ALL`, validação de prefixos BNCC e metadados, exceção de revisão docente, `authorizeStudentDataAccess`, fuso `America/Sao_Paulo` e parser estrito de datas em `formatSafeDatePtBr`.
- [`apps/electron/src/ui/layouts/PortalLayout.tsx`](../apps/electron/src/ui/layouts/PortalLayout.tsx) — `resolvePortalPreviewState`, indicador de sessão real + modo de prévia somente leitura, restrição do seletor de portais e compensação de `width`/`minHeight` para `zoom !== 100%`.
- [`apps/electron/src/ui/pages/LoginPage.tsx`](../apps/electron/src/ui/pages/LoginPage.tsx) & [`apps/electron/src/ui/pages/ReceptionPortal.css`](../apps/electron/src/ui/pages/ReceptionPortal.css) — Correção da sobreposição de ícones nos campos de login e escopo de `.reception-container .input-group`.
- [`apps/electron/src/ui/pages/SeatingIntelligence.tsx`](../apps/electron/src/ui/pages/SeatingIntelligence.tsx) & [`apps/electron/src/ui/pages/SeatingIntelligence.css`](../apps/electron/src/ui/pages/SeatingIntelligence.css) — Substituição de `seat-full-photo` esticado por card horizontal legível, `flex-wrap` no cabeçalho (`Salvar Mapa` visível em 100%) e compensação de zoom.
- [`apps/electron/src/ui/portals/TeacherPortal.tsx`](../apps/electron/src/ui/portals/TeacherPortal.tsx) — Correção de `useState is not defined` e aplicação de `.aquila-ui`.
- [`apps/electron/src/ui/pages/TeacherGradebook.tsx`](../apps/electron/src/ui/pages/TeacherGradebook.tsx) — `evaluateGradebookRow` (`REGRA-AVAL-2026.1`), média acumulada por bimestres ativos, confirmação de saída com alterações não salvas e trilha de auditoria.
- [`apps/electron/src/ui/pages/AttendanceCall.tsx`](../apps/electron/src/ui/pages/AttendanceCall.tsx) & [`apps/electron/src/ui/pages/Diary.tsx`](../apps/electron/src/ui/pages/Diary.tsx) — 4 estados (`unverified`, `present`, `absent`, `justified`), estado inicial `Não conferido`, ação em lote com contagem + `Desfazer`, sincronia com `Diary.tsx` e biometria desabilitada para H-01.
- [`apps/electron/src/ui/components/StudentRPGPortal.tsx`](../apps/electron/src/ui/components/StudentRPGPortal.tsx) — Sincronização de `studentId`, filtro estrito de tarefas sem fallback para itens sem `classId`, datas sem `'Recente'` e banner `object-contain`.
- [`apps/electron/src/ui/utils/historicalPersonas.ts`](../apps/electron/src/ui/utils/historicalPersonas.ts), [`apps/electron/src/ui/components/BNCCSkillTree.tsx`](../apps/electron/src/ui/components/BNCCSkillTree.tsx), [`apps/electron/src/ui/components/SovereignPvPArena.tsx`](../apps/electron/src/ui/components/SovereignPvPArena.tsx), [`apps/electron/src/main/services/CosmeticGrantService.ts`](../apps/electron/src/main/services/CosmeticGrantService.ts), [`apps/electron/src/main/services/BattleBannerCatalogService.ts`](../apps/electron/src/main/services/BattleBannerCatalogService.ts) & [`apps/electron/src/database/cosmetics.catalog.json`](../apps/electron/src/database/cosmetics.catalog.json) — Gate editorial de citações e nota biográfica factual de Marie Curie (`1867–1934, Nobel de Física 1903 e Química 1911`).
- [`apps/electron/src/ipc/handlers.ts`](../apps/electron/src/ipc/handlers.ts) — Autorização backend em `get-students`, `tasks:list`, `tasks:create`, `tasks:update` e `tasks:delete`.
- [`apps/electron/src/ui/styles/aquila-ui-tokens.css`](../apps/electron/src/ui/styles/aquila-ui-tokens.css) — Tokens `.aquila-ui` dark-first e light-theme.

### Coletor, Harness e Suítes de Verificação (`scripts/`)
- [`scripts/swarm_continuous_finetune_daemon.py`](../scripts/swarm_continuous_finetune_daemon.py) — `is_safe_ip_address`, `SafeRedirectHandler`, `open_safe_url` e `validate_candidate_document_bytes`.
- [`scripts/h01/test_collector_10_fixtures.py`](../scripts/h01/test_collector_10_fixtures.py) — Suíte automatizada com as 10 fixtures do coletor e SSRF redirect guard.
- [`scripts/colab_harness/aquila_colab_harness.py`](../scripts/colab_harness/aquila_colab_harness.py) & [`scripts/colab_harness/test_colab_harness.py`](../scripts/colab_harness/test_colab_harness.py) — Implementação e teste controlado de 8 passos do harness local PC + simulador `/v1/chat/completions`.
- [`scripts/h01/test_pp_mission_verification.cjs`](../scripts/h01/test_pp_mission_verification.cjs) — Suíte automatizada de verificação dos Itens 2 a 8.

---

## 4. Comandos Executados e Resultados Reais

| Comando Executado | Resultado | Relatório Gerado |
| :--- | :---: | :--- |
| `python scripts/h01/test_collector_10_fixtures.py` | **PASS (10/10 fixtures)** | [`test-results/collector_10_fixtures_report.json`](../test-results/collector_10_fixtures_report.json) |
| `python scripts/colab_harness/test_colab_harness.py` | **PASS (8/8 checks — Simulador Local)** | [`test-results/colab_harness_verification_report.json`](../test-results/colab_harness_verification_report.json) |
| `node scripts/h01/test_pp_mission_verification.cjs` | **PASS (12/12 checks — Itens 2 a 8)** | [`test-results/pp_mission_verification_report.json`](../test-results/pp_mission_verification_report.json) |
| `npm --prefix apps/electron run build` | **PASS (3637 módulos Vite + Electron Main)** | `apps/electron/dist` e `win-unpacked/resources/app.asar` atualizados |

---

## 5. Pendências que Dependem de Aprovação Humana ou Ambiente Físico

1. **Validação em Máquina Windows Limpa Dedicada (`E-01`):**  
   O pacote `win-unpacked` (`Aquila Pro.exe` + `resources/app.asar` atualizado) foi compilado e iniciado localmente, mas a instalação e execução em máquina física de bancada sem ferramentas de desenvolvimento instaladas permanece como etapa presencial obrigatória antes da liberação do piloto.
2. **Aceite Humano Formal (`E-02`):**  
   O dossiê (`perplexity/dossie_homologacao_h01_final.md`) e os pareceres estão **preparados tecnicamente**, aguardando conferência presencial da jornada escolar e assinatura das lideranças (Coordenação, Direção, DPO e TI).
3. **Execução Supervisionada em GPU Remota Colab (Opcional / Fora do H-01):**  
   O harness PC + Colab foi validado localmente por simulador de contrato HTTP (`/v1/chat/completions`). Quando uma instância Colab com `vllm serve` estiver ativa com túnel autenticado, basta definir `COLAB_LLM_BASE_URL` e `COLAB_LLM_TOKEN` no ambiente para conectá-lo sem alterar código.
4. **Publicação / Push / Release (Bloqueado por Governança HITL):**  
   Todas as alterações encontram-se prontas e testadas no repositório local. Aguardando autorização explícita da usuária caso deseje realizar commit/push para o repositório remoto.
