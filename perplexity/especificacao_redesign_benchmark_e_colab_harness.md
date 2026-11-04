# Especificação Unificada de Redesign, Escopo por Série, Coletor PDF/GPU, Benchmark Activesoft e Colab Harness

**Projeto:** Áquila Pro School OS (`v2.1.0-RC1`)  
**Branch:** `integration/stabilization-and-quarantine`  
**Escopo:** Consolidação técnica das diretrizes de redesign de interface, isolamento estrito de conteúdo por série do estudante, saneamento do coletor de documentos, auditoria Web vs. Electron, benchmark funcional (Activesoft) e arquitetura de harness local com inferência remota no Google Colab.

---

## 1. Isolamento Estrito por Série/Turma do Estudante (Correção Aplicada)

### Problema Identificado
O estudante visualizava questões, playlists, applets e habilidades de todas as séries/etapas (`Fundamental I`, `Fundamental II`, `Ensino Médio` e `Medicina`) misturadas porque:
1. [`StudentMasteryChamber.tsx`](../apps/electron/src/ui/pages/StudentMasteryChamber.tsx) inicializava `selectedStage = 'ALL'` e fazia fallback para todo o `TRI_ITEM_BANK` (cujo primeiro item é `EF03MA06` do 3º ano do Fundamental I).
2. [`BNCCSkillTree.tsx`](../apps/electron/src/ui/components/BNCCSkillTree.tsx) buscava questões por área sem filtrar a etapa do aluno (`TRI_ITEM_BANK[0]`).
3. [`StudentPlaylistsViewer.tsx`](../apps/electron/src/ui/components/StudentPlaylistsViewer.tsx) exibia playlists de `EF01MA04` ("Floresta Mágica" — 1º/2º ano EF) junto com `EM13CNT102` (Ensino Médio).
4. [`H5PPerseusAppletLab.tsx`](../apps/electron/src/ui/components/H5PPerseusAppletLab.tsx) listava todo o catálogo sem filtrar `gradeLevel` / `bnccCode`.

### Solução Implementada
- Criado o módulo central [`studentGradeScope.ts`](../apps/electron/src/ui/utils/studentGradeScope.ts) com `resolveStudentGradeContext(studentId)` e `matchesStudentGradeScope(item, ctx)`.
- Aplicado filtro estrito por série/etapa em:
  - [`StudentRPGPortal.tsx`](../apps/electron/src/ui/components/StudentRPGPortal.tsx): carrega apenas tarefas (`tasks:list`) e resumos de aula da turma/série matriculada (`studentCtx.classId` / `studentCtx.stage`).
  - [`StudentMasteryChamber.tsx`](../apps/electron/src/ui/pages/StudentMasteryChamber.tsx): trava `selectedStage` na etapa do estudante e filtra questões e conceitos exclusivamente para a sua série.
  - [`BNCCSkillTree.tsx`](../apps/electron/src/ui/components/BNCCSkillTree.tsx): filtra nós BNCC e questões práticas estritamente pela etapa do aluno.
  - [`StudentPlaylistsViewer.tsx`](../apps/electron/src/ui/components/StudentPlaylistsViewer.tsx): filtra roteiros por `classId` e prefixos BNCC da série do estudante.
  - [`H5PPerseusAppletLab.tsx`](../apps/electron/src/ui/components/H5PPerseusAppletLab.tsx): filtra applets interativos pela série/etapa do estudante.

---

## 2. Correções Imediatas de Interface e Conteúdo (Aplicadas)

| Achado da Auditoria | Causa Raiz | Correção Aplicada |
|---|---|---|
| `Invalid Date` nos cards de cápsulas do aluno | `new Date(pod.created_at).toLocaleDateString()` sem validação de formato/fallback | Substituído por `formatSafeDatePtBr(pod.created_at \|\| pod.createdAt, 'Recente')` em [`StudentRPGPortal.tsx`](../apps/electron/src/ui/components/StudentRPGPortal.tsx) |
| Tarefas de `04/11` marcadas como `(HOJE)` em `03/11` no Modo Sala | `currentTime.toISOString().split('T')[0]` usava UTC (que avança para o dia seguinte às 21h BRT) | Substituído por `getLocalTodayIsoDate(currentTime)` em [`ClassroomDashboard.tsx`](../apps/electron/src/ui/pages/ClassroomDashboard.tsx) |
| Citação de Marie Curie sem fonte primária no Córtex Lab e Árvore BNCC | Frase *"Nada na vida deve ser temido..."* ainda constava em `historicalPersonas.ts` e `BNCCSkillTree.tsx` | Substituída pela citação verificada de *Recherches sur les substances radioactives* (Thèse de doctorat, Paris, 1903) em [`historicalPersonas.ts`](../apps/electron/src/ui/utils/historicalPersonas.ts) e [`BNCCSkillTree.tsx`](../apps/electron/src/ui/components/BNCCSkillTree.tsx) |
| Confusão entre sessão autenticada (`ANDRE — DOCENTE`) e prévia de outro portal | Ausência de indicador explícito de modo de prévia | Adicionado selo `"Modo de Prévia: Portal do Aluno / Família"` e indicador `"Conectado • Base Local"` em [`PortalLayout.tsx`](../apps/electron/src/ui/layouts/PortalLayout.tsx) |
| Ambiguidade entre `Média Anual < 6,0` e status `APROVADO` na Planilha de Notas | Coluna `Situação` avaliava apenas o bimestre, mas ficava ao lado de `Média Anual` com rótulo finalista | Colunas renomeadas para `Média Acumulada` e `Situação (Bimestre)`, exibindo `REGULAR (B3)`, `BIM. OK • ACUM. < 6` ou `RECUPERAÇÃO (B3)`, além de agrupar ferramentas secundárias no menu `Mais ações ▾` e manter `Salvar notas` como ação principal única em [`TeacherGradebook.tsx`](../apps/electron/src/ui/pages/TeacherGradebook.tsx) |
| Tokens CSS de referência (`.aquila-ui` claro/escuro) | Necessidade de base padronizada WCAG 2.2 AA para transição gradual | Criado [`aquila-ui-tokens.css`](../apps/electron/src/ui/styles/aquila-ui-tokens.css) |

---

## 3. Saneamento do Coletor de Documentos (`invalid pdf header: b'<!DOC'`)

### Causa Raiz
O coletor [`scripts/swarm_continuous_finetune_daemon.py`](../scripts/swarm_continuous_finetune_daemon.py) baixava URLs de páginas HTML (incluindo links de vídeo e páginas de redirecionamento/erro) diretamente para `PDF_DIR` e invocava `PdfReader(io.BytesIO(raw_bytes))`, gerando `invalid pdf header: b'<!DOC'` e `EOF marker not found`, além de marcar o estado como `BAIXADO`.

### Correção Aplicada em `scripts/swarm_continuous_finetune_daemon.py`
1. Links de vídeo (`youtube.com/watch`, `youtu.be/`) são classificados diretamente como `CATALOGADO_METADATA_VIDEO` sem passar pelo leitor de PDF.
2. Registro de URL original, URL final após redirecionamentos (`resp.geturl()`), status HTTP, `Content-Type` e tamanho em bytes.
3. Rejeição imediata de payloads HTML (`Content-Type: text/html` ou início `<!DOC` / `<HTML`) antes de chamar `PdfReader`, marcando o registro como `REJECTED_INVALID_DOCUMENT` com motivo rastreável.
4. Validação estrutural de cabeçalho `%PDF-`, marcador `%%EOF` e `len(reader.pages) > 0`; falhas estruturais permanecem bloqueadas em `REJECTED_INVALID_DOCUMENT` e nunca seguem para OCR, embeddings ou SFT.

---

## 4. Diretrizes de Redesign, Benchmark Activesoft e Arquitetura Colab Harness

1. **Menus e Hierarquia por Perfil:**
   - Três níveis: Cabeçalho global enxuto → Menu lateral restrito ao papel → Conteúdo com 1 ação principal preenchida (`Salvar notas`, `Salvar chamada`, `Continuar atividade`) e ações secundárias em `Mais ações ▾`.
   - Padrão de rótulos **Verbo + Objeto** (`Praticar questões`, `Assistente de estudos`, `Exportar planilha`, `Enviar ao SigaWeb`).
2. **Encadeamento Acadêmico (Benchmark Activesoft):**
   - Separação estrita entre **Pessoa**, **Usuário**, **Vínculo**, **Matrícula** e **Enturmação**.
   - Registro único de frequência e avaliação refletindo de forma consistente entre Diário, Planilha, Boletim, Coordenação e Família.
3. **Arquitetura Harness Local (PC) + Inferência Remota (Colab vLLM):**
   - **PC Local:** mantém o repositório, harness de ferramentas, validação de permissões, execução de testes e estado de retomada.
   - **Colab GPU:** executa exclusivamente o servidor de inferência compatível com OpenAI (`vllm serve --api-key`) em sessão supervisionada, com telemetria verificada via `nvidia-smi`.
