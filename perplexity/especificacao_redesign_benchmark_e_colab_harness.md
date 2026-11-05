# Especificação Unificada de Redesign, Escopo por Série, Coletor PDF/GPU, Benchmark Activesoft e Colab Harness

**Projeto:** Áquila Pro School OS (`v2.1.0-RC1`)  
**Branch:** `integration/stabilization-and-quarantine`  
**Base Commit:** `fb6f1e7a758d93bac03945e18353f59989cdfe37`  
**Escopo:** Consolidação técnica e evidência de execução das correções de escopo curricular por série, datas/fusos (`America/Sao_Paulo`), isolamento de prévia de portais, regras de notas e frequência, gate editorial histórico, redesign das telas prioritárias, coletor de documentos com proteção SSRF em redirecionamentos e harness PC + inferência Colab.

---

## 1. Isolamento Estrito por Série/Turma do Estudante e Autorização Backend (Item 2)

### Problemas Corrigidos
1. **Ausência de fallback amplo (`ALL`):** [`studentGradeScope.ts`](../apps/electron/src/ui/utils/studentGradeScope.ts) retorna `stage: 'UNVERIFIED'` e `isContextValid: false` quando o contexto do estudante ou turma está ausente ou inválido; nenhum item é exibido em caso de contexto inválido.
2. **Prefixos BNCC amplos e metadados insuficientes:** Prefixos amplos de faixa (`EF15`, `EF67`, `EF69`, `EF89`) não são aceitos sozinhos sem confirmação da série exata (`seriesNumber` / `classId`). Itens sem metadados curriculares verificáveis são explicitamente rejeitados (`false`).
3. **Exceção pedagógica rastreável:** Professores autorizados podem atribuir material de revisão de outra série mediante `crossGradeAssignment` contendo `assignedByTeacherId`, `pedagogicalReason`, `assignedAt` e `targetStudentId`/`targetClassId`, liberando apenas o item atribuído para a turma/aluno alvo.
4. **Autorização no Frontend e no Backend/IPC:** `authorizeStudentDataAccess` e os handlers IPC (`get-students`, `tasks:list`, `tasks:create`, `tasks:update`, `tasks:delete` em [`handlers.ts`](../apps/electron/src/ipc/handlers.ts)) bloqueiam consultas entre alunos (`FORBIDDEN_CROSS_STUDENT_ACCESS`) e entre turmas (`FORBIDDEN_CROSS_CLASS_ACCESS`), bem como escritas por perfis não autorizados.

---

## 2. Datas, Períodos e Fuso Oficial `America/Sao_Paulo` (Item 3)

- **Fuso explícito:** `DEFAULT_SCHOOL_TIMEZONE = 'America/Sao_Paulo'` em [`studentGradeScope.ts`](../apps/electron/src/ui/utils/studentGradeScope.ts).
- **Virada de dia em BRT (`21h–23h59`):** `getSchoolTodayIsoDate` resolve a data civil no fuso da escola, impedindo que `toISOString()` (UTC) avance a data para o dia seguinte às 21h BRT.
- **Fim do mascaramento `'Recente'`:** `formatSafeDatePtBr` nunca substitui datas ausentes ou inválidas por `'Recente'`, exibindo explicitamente `'Data não informada'`.

---

## 3. Prévia de Portais vs. Sessão Real (Item 4)

- **Isolamento de sessão e bloqueio de escrita:** `resolvePortalPreviewState` em [`PortalLayout.tsx`](../apps/electron/src/ui/layouts/PortalLayout.tsx) preserva o papel autenticado real, exibe `Sessão: <Nome> (<Papel>)` + badge `Modo de Prévia (Somente Leitura)` e bloqueia mutações (`canExecuteWriteInPortal: false` / `PREVIEW_READ_ONLY` no IPC).
- **Confinamento de perfis:** Perfis `student`, `parent` e `secretaria` não visualizam o seletor inter-portais e são confinados às suas rotas autorizadas em [`App.tsx`](../apps/electron/src/App.tsx).

---

## 4. Notas, Médias e Recuperação — Regra Versionada `REGRA-AVAL-2026.1` (Item 5)

- **Nota vazia (`""`) ≠ `0`:** `evaluateGradebookRow` em [`TeacherGradebook.tsx`](../apps/electron/src/ui/pages/TeacherGradebook.tsx) retorna `bimesterMean: null` e `PENDING_ENTRY` quando nenhuma avaliação foi lançada, e calcula a média parcial proporcional apenas sobre as avaliações preenchidas.
- **Média acumulada sem zerar bimestres futuros:** Bimestres ainda não iniciados não entram como `0` no denominador da média acumulada.
- **Confirmação de alterações não salvas e trilha de auditoria:** Modal de confirmação ao sair com alterações pendentes (`Continuar editando`, `Descartar alterações`, `Salvar e sair`) e registro de histórico de alterações (`usuário`, `data/hora`, `campo`, `valor anterior`, `valor novo`).

---

## 5. Frequência e Diário Sincronizados (Item 6)

- **Quatro estados explícitos em [`AttendanceCall.tsx`](../apps/electron/src/ui/pages/AttendanceCall.tsx):** `unverified` (`Não conferido`), `present` (`Presente`), `absent` (`Ausente`) e `justified` (`Justificado`).
- **Inicialização segura:** Ao abrir uma turma sem chamada salva no dia, todos os alunos iniciam como `Não conferido` (`unverified`), nunca como `Presente` automático.
- **Lote com contagem e Desfazer:** O menu `Marcar em lote` informa a quantidade de alunos afetados e disponibiliza `Desfazer lote` antes do salvamento.
- **Sincronização com [`Diary.tsx`](../apps/electron/src/ui/pages/Diary.tsx) e quarentena biométrica:** O salvamento persiste os registros e sincroniza bidirecionalmente com `Diary.tsx`. O controle biométrico permanece desabilitado para o piloto `H-01` (`Biometria (Fora do Piloto H-01)`).

---

## 6. Citação de Marie Curie e Gate Editorial (Item 7)

- **Remoção de citações não verificadas na fonte primária:** Em [`historicalPersonas.ts`](../apps/electron/src/ui/utils/historicalPersonas.ts), [`BNCCSkillTree.tsx`](../apps/electron/src/ui/components/BNCCSkillTree.tsx) e [`SovereignPvPArena.tsx`](../apps/electron/src/ui/components/SovereignPvPArena.tsx), citações atribuídas a Marie Curie sem comprovação literal anexada foram omitidas (`famousQuote: ''`, `quoteVerified: false`), mantendo-se a nota biográfica factual (`1867–1934, Nobel de Física 1903 e Química 1911`).
- **Gate Editorial em código:** `getVerifiedPersonaQuote` e `validateEditorialQuoteGate` ([`BattleBannerCatalogService.ts`](../apps/electron/src/main/services/BattleBannerCatalogService.ts) / [`CosmeticGrantService.ts`](../apps/electron/src/main/services/CosmeticGrantService.ts)) exigem `sourceWork`, `sourceLocator` e `verified: true` para qualquer citação textual.

---

## 7. Correções Visuais das 6 Capturas e Redesign das 4 Telas Prioritárias (Item 8)

| Tela / Componente | Problema Visual Diagnosticado | Correção Aplicada e Compilada no `app.asar` |
| :--- | :--- | :--- |
| [`LoginPage.tsx`](../apps/electron/src/ui/pages/LoginPage.tsx) + [`ReceptionPortal.css`](../apps/electron/src/ui/pages/ReceptionPortal.css) | Ícones de usuário/cadeado sobrepostos ao texto digitado e botão roxo no olho de senha | Escopado `.reception-container .input-group` em `ReceptionPortal.css`; aplicado `paddingLeft: '44px'` nos inputs e `background: 'transparent'` no botão de visibilidade da senha |
| [`PortalLayout.tsx`](../apps/electron/src/ui/layouts/PortalLayout.tsx) | Zoom `60%` encolhia o container verticalmente deixando faixa preta vazia de 40% na parte inferior | Compensação proporcional `width: ${10000 / zoomPercent}%` e `minHeight: ${10000 / zoomPercent}%` quando `zoomPercent !== 100` |
| [`SeatingIntelligence.tsx`](../apps/electron/src/ui/pages/SeatingIntelligence.tsx) + [`SeatingIntelligence.css`](../apps/electron/src/ui/pages/SeatingIntelligence.css) | Fotos verticais esticadas no fundo das carteiras (`seat-full-photo`), botão `Salvar Mapa` cortado à direita em 100% e tabela Lista cortada em 60% | Substituído `seat-full-photo` por card horizontal limpo (avatar circular `34x34` + nome em 2 linhas + `Fila X • Cart. Y`), `flex-wrap: wrap` no cabeçalho e altura flexível na visão Lista |
| [`TeacherPortal.tsx`](../apps/electron/src/ui/portals/TeacherPortal.tsx) | Erro `useState is not defined` na tela inicial do professor | Restaurado `import React, { useState, useEffect } from 'react'` e redesenhado o painel inicial focado na rotina de aula |
| [`StudentRPGPortal.tsx`](../apps/electron/src/ui/components/StudentRPGPortal.tsx) | Banner ilustrado com recortes truncados nas laterais e datas `Recente` | Ajustado container para `object-contain` com moldura limpa e datas validadas via `formatSafeDatePtBr` |
| [`aquila-ui-tokens.css`](../apps/electron/src/ui/styles/aquila-ui-tokens.css) | Risco de colisão de fundo claro em telas escuras | Tokens `.aquila-ui` configurados com variáveis dark-first (`--bg-canvas: #0B1220`, `--accent-primary: #3B82F6`) sem sobrescrever indevidamente superfícies escuras |

---

## 8. Coletor de Documentos e Harness PC + Colab (Itens 9 e 10)

- **Coletor e Anti-SSRF ([`swarm_continuous_finetune_daemon.py`](../scripts/swarm_continuous_finetune_daemon.py)):** Adicionados `is_safe_ip_address` (bloqueando RFC1918, loopback, link-local, multicast e reservados), `SafeRedirectHandler` (validando cada salto de redirecionamento HTTP) e `validate_candidate_document_bytes`. Validado em 10/10 fixtures sintéticas ([`test_collector_10_fixtures.py`](../scripts/h01/test_collector_10_fixtures.py)).
- **Harness Local PC + Inferência Colab ([`aquila_colab_harness.py`](../scripts/colab_harness/aquila_colab_harness.py)):** Configurado exclusivamente por variáveis de ambiente (`COLAB_LLM_BASE_URL`, `COLAB_LLM_TOKEN`, `COLAB_MODEL`, `AQUILA_WORKSPACE`), com bloqueio de caminhos externos/sensíveis, allowlist de comandos sem `shell=True`, persistência a cada passo e parada em `max_steps=8`. Validado em 8/8 cenários contra simulador local `/v1/chat/completions` ([`test_colab_harness.py`](../scripts/colab_harness/test_colab_harness.py)).
