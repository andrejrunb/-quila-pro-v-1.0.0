# 0002. Orquestração Soberana com LangGraph, Execução Durável e Barreira HITL

- **Status:** Aceito (Accepted)
- **Data:** 2026-11-07
- **Autores:** Córtex Central Áquila Pro & Engenharia de Sistemas
- **Decisores:** Arquiteto-Chefe, DPO e Responsável Pedagógico
- **Contexto:** Constituição v2.1, LGPD Art. 14/16, Execução Durável e Soberania Local

---

## 1. Contexto e Motivação

O ecossistema Áquila Pro necessita de um motor de orquestração multiagente para coordenar tarefas analíticas, pedagógicas e administrativas (ex: nivelamento adaptativo, geração de materiais didáticos, validação psicométrica TRI e rotinas de secretaria).

Tentativas ingênuas de orquestração por IA costumam incorrer em cinco vulnerabilidades graves:
1. **Supervisores concorrentes:** Múltiplos frameworks disputando o controle do fluxo.
2. **Transferência de regras escolares para prompts:** Delegar autorizações ou regras de negócio a prompts probabilísticos de LLM em vez de validações determinísticas de software.
3. **Inchaço de estado (State Bloat):** Armazenar áudios, vídeos, PDFs e matrizes pesadas dentro dos snapshots de checkpoint, degradando o banco de dados.
4. **Falsa autenticação HITL:** Utilizar assinaturas geradas no frontend/renderer (ex: Electron) baseadas em tokens voláteis de sessão, criando vetores de bypass.
5. **Efeitos colaterais não-idempotentes na retomada:** Falhas ou reinicializações do processo reexecutando nós que já realizaram mutações externas, gerando duplicidade de publicações ou cobranças.

---

## 2. Decisões Arquiteturais

### 2.1 Orquestrador Único e Soberano (LangGraph)
- **Decisão:** O **LangGraph** (`StateGraph`) é o único controlador e máquina de estados de fluxos de tarefas.
- **Papel do LangChain:** O LangChain é utilizado estritamente como adaptador de modelos, recuperação de documentos e chamadas de ferramentas (*tools*), sem jamais arbitrar permissões ou regras escolares.
- **Workers Especializados:** Tarefas especializadas (visão computacional, síntese de voz, matrizes TRI) são workers isolados e substituíveis, sem acoplamento monolítico.

### 2.2 Isolamento de Checkpoints e Padrão Claim-Check
- **Decisão:** O banco de dados escolar de produção (`aquila.db`) jamais recebe checkpoints operacionais do orquestrador.
- **Banco de Checkpoints:** Checkpoints são persistidos exclusivamente em um SQLite isolado (`orchestrator_checkpoints.db`) com modo WAL, localizado no diretório configurado pelo ambiente (`%APPDATA%\AquilaPro\orchestrator\` em dev, ou caminho de serviço em servidor edge).
- **Padrão Claim-Check (Content-Addressable Storage):** Binários gerados (vídeos, locuções, PDFs, imagens) residem no disco sob `storage/blobs/<sha256>`. O estado do LangGraph transporta exclusivamente o identificador, tipo MIME, tamanho em bytes e o hash SHA-256 de integridade.

### 2.3 Protocolo Corrigido de Aprovação Humana (Zero-Bypass HITL)
- **Decisão:** A aprovação humana é um contrato transacional formal emitido e conferido pelo backend, nunca uma assinatura forjada no renderer.
- **Ciclo de Aprovação:**
  1. O servidor cria uma solicitação com UUID único (`approval_id`).
  2. A solicitação vincula: `run_id`, `school_id`, `workflow_version`, `artifact_manifest_hash`, `requested_action`, `requested_at` e `expires_at`.
  3. O Electron renderiza a prévia do material diretamente do armazenamento local.
  4. O usuário autenticado (docente/coordenador) envia sua decisão (`APPROVED` ou `REJECTED`) acompanhada de seu token de sessão.
  5. O backend autentica a sessão, valida o papel (`TEACHER`, `COORDINATOR`, `ADMIN`), o vínculo com a escola (`school_id`), e a competência sobre a disciplina.
  6. O backend confere se o manifesto dos artefatos atuais corresponde rigorosamente ao hash aprovado (`artifact_manifest_hash`). Qualquer alteração no conteúdo invalida o aceite.
  7. O backend marca a solicitação como consumida (`consumed_at`), impedindo reutilização.
  8. O recibo da publicação é autenticado por chave privada do servidor (HMAC-SHA256 ou Ed25519), mantida sob custódia segura fora do alcance do renderer.

### 2.4 Execução Durável e Idempotência de Efeitos Externos
- **Decisão:** A retomada após interrupção (`interrupt()`) ou recuperação de falha deve seguir o princípio de execução durável do LangGraph, onde nós podem ser reexecutados sem duplicar efeitos externos.
- **Separação de Nós:**
  $$\text{authorize} \longrightarrow \text{create\_draft} \longrightarrow \text{verify\_schema} \longrightarrow \text{prepare\_approval} \longrightarrow \text{await\_approval} \longrightarrow \text{validate\_approval} \longrightarrow \text{publish\_idempotently}$$
- **Chave de Idempotência Estável:**
  $$\text{idempotency\_key} = \text{SHA-256}(\text{school\_id} \parallel \text{run\_id} \parallel \text{artifact\_manifest\_hash} \parallel \text{requested\_action})$$
- O serviço de publicação verifica se a `idempotency_key` já consta no registro de publicações. Se existir, retorna o recibo existente sem reescrever ou republicar.

### 2.5 Delimitação Pedagógica e Direitos Autorais
- **Decisão:** Questões e simulações dependem de registro explícito de proveniência (`provenance`) e licença compatível (ex: CC BY-NC, domínio público ou autorização de banca).
- **Verificação Matemática Estruturada:** Circuitos elétricos são representados em esquemas tipados (componentes, nós, valores numéricos, tolerâncias e grandezas solicitadas). Leis de Ohm ($V = R \cdot I$) e Kirchhoff são validadas deterministicamente antes de qualquer geração de texto ou áudio.
- **Segregação Enunciado $\times$ Gabarito:** Enunciado e gabarito constituem artefatos distintos. O áudio direcionado ao estudante nunca embute o gabarito comentado sem permissão explícita.

---

## 3. Consequências

### Positivas
- **Resiliência a Falhas:** Quedas de energia ou reinicializações na máquina da escola preservam a execução exatamente no ponto de interrupção.
- **Conformidade LGPD:** Nenhum dado pessoal identificável de estudantes transita nos prompts ou checkpoints do orquestrador.
- **Imutabilidade de Auditoria:** Toda decisão de publicação gera registro na trilha `zero_bypass_audits` com identificador do revisor humano e hash de manifesto.
- **Sem Falsos Positivos:** Ausência de serviços externos ou GPU gera erro explícito (`WorkerUnavailableError`), proibindo saídas fictícias.

### Limitações e Mitigações
- **Revisão Humana Obrigatória:** Conteúdos gerados não chegam ao aluno sem aprovação docente explícita, introduzindo dependência de tempo humano (*Human-in-the-Loop*). Mitigado por TTL configurável e fila de prioridade na interface docente.
- **Escopo Inicial E0/E1 Delimitado:** O primeiro grafo exclui GPU, voz local neural (CosyVoice) e modelos 3D, utilizando geradores simulados e circuitos resistivos determinísticos até homologação do motor.

---
*Aprovado em conformidade com a Constituição v2.1 do Áquila Pro.*
