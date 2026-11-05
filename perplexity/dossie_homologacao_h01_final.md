# Dossiê de Homologação & Plano de Liberação Operacional — Piloto H-01 (v2.1.1)

> **Status de prontidão — v2.1.1 (Candidata à Homologação Presencial):** As verificações automatizadas de código e bancada descritas neste dossiê foram concluídas com sucesso. Esta versão permanece classificada estritamente como **candidata à homologação presencial**, e não como liberação automática de operação escolar. A liberação operacional em campo depende da conferência das evidências na estação-alvo, validação de usabilidade e integridade sem dependências de desenvolvimento, e cumprimento dos gates formais de governança com aceite conjunto da Direção Escolar, DPO e TI. O cenário de até 500 alunos/20 turmas é classificado como **capacidade arquitetural a homologar em bancada sintética**; o **escopo de campo autorizado para o Piloto H-01 é estritamente limitado a 1 turma piloto (até 30 alunos)** por uma semana.

---

## 1. Identidade Criptográfica do Artefato Candidato & Tríade de Rastreabilidade

Para eliminar qualquer ambiguidade entre versões, commits de código, execuções de teste e publicação documental, a rastreabilidade do artefato é definida pela seguinte **Tríade de Commits**:

```text
source_commit:        0612be71f307399e2bc8d31fe1dc71e9a7e37e9d
                      (Build do código-fonte, empacotamento do executável e app.asar)

evidence_commit:      050b3ce92bf18b3874134be1086a2e411f16da0a
                      (Execução das suítes de teste de bancada e geração dos relatórios JSON)

documentation_commit: 8a21eec7cd17742aeab7bc866612dfe053f4a62c
                      (Dossiê v2.1.1 harmonizado, manifesto SHA256SUMS, plano executivo e motor DR)
```

> **Garantia de Integridade Criptográfica:** Os componentes listados tiveram seus hashes comparados entre os pontos de referência identificados, conforme relatório de comparação anexado. Os hashes SHA-256 do binário executável (`Aquila Pro.exe`), do pacote (`resources/app.asar`) e do módulo nativo (`better_sqlite3.node`) são **rigorosamente idênticos** nos commits da tríade, comprovando de forma matemática que nenhuma alteração não auditada ocorreu no binário ou no pacote do aplicativo.

### Build Manifest dos Componentes de Distribuição

```text
Versão do Sistema:        v2.1.0 (Dossiê de Homologação v2.1.1)
Arquitetura Alvo:         Windows 10 / 11 Pro 64-bit (x86_64)
Formato de Distribuição:  Pacote Portável Autônomo (win-unpacked)
Caminho do Pacote:        apps/electron/release_v2_2/win-unpacked/
Executável Principal:     Aquila Pro.exe
SHA-256 (Executável):     F087E4B45834D8DAECBF88DD61B0A2757AB836B8A1891C16CA0AAB321E5D7EBB
Pacote da Aplicação:      resources/app.asar
SHA-256 (app.asar):       270A6696E7A8EDFD4DCD3FA198DBCE2D0D0E40847E52EDB41BE0FCDA934B2445
Módulos Nativos:          resources/app.asar.unpacked/node_modules/better-sqlite3/ (ABI 119 - Electron 28.2.0)
SHA-256 (better_sqlite3): AD19705C7938A60EF5557E31D152843CC42364684913847FBD623484430283A3
Script Transacional DR:   restore_edge.bat (Embutido no pacote portátil)
SHA-256 (restore_edge):   428430E1B0A9B7367FB112BE0585893953D92403CE123AF28E3EADF3AF3912A5
Motor Autônomo DR:        restore_edge.ps1 (Embutido no pacote portátil)
SHA-256 (restore_edge_ps): 06DE5C709B3800CB43C2021D7A3D5211EEB15FDFE75733A4A5FEB5483846B36C
Variáveis de Ambiente:    AQUILA_ENABLE_CLOUD_CONNECTORS=false (Padrão Offline-First Ativo)
```

---

## 2. Delimitação Clara de Escopo e Capacidade

| Dimensão | Escopo Definido | Detalhamento Operacional |
| :--- | :--- | :--- |
| **Teste Funcional de Bancada** | 20 alunos sintéticos | Importação de lote CSV, lançamento de notas, criação de avaliação e intervenções pedagógicas sem dados reais. |
| **Capacidade Arquitetural Pretendida** | Até 20 turmas / 500 alunos cadastrados | Homologação de estresse sintético do SQLite (`WAL`) e do schema de dados na estação edge. *"20 salas"* refere-se ao cadastro institucional de turmas, operadas em 1 estação servidora local. |
| **Escopo Autorizado de Campo (Piloto H-01)** | **1 única turma (até 30 alunos)** | Duração máxima de 1 semana letiva com acompanhamento técnico presencial. A expansão para demais turmas dependerá de relatório final aprovado. |

---

## 3. Matriz das 8 Prioridades de Liberação Operacional

| Prioridade | Item Operacional | Verificado em Código e Bancada Técnica | Procedimento na Máquina da Escola (Sem Ferramentas Dev) | Critério de Fechamento & Evidência |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **Instalação Limpa Windows (v2.1.0)** | **Isolamento de Runtime por PATH Sanitizado (Bancada Local):** PASS (`clean_runtime_h01_evidence.json`). Executável iniciado sem Node/Git no PATH, responsivo, fechamento gracioso.<br>**Homologação em Windows Limpo (Ambiente-Alvo):** Etapa presencial a ser executada na máquina física da escola. | Copiar pasta `win-unpacked` para `C:\AquilaPro` em máquina Windows 10/11 Pro sem Node.js, Python ou Git. Clicar duas vezes em `Aquila Pro.exe`. | App abre em < 3s, exibe versão `v2.1.0` no rodapé e não emite erro de DLL/ABI nativa. |
| **2** | **Jornada Escolar Ponta a Ponta** | Testada em banco SQLite sintético (`WAL`): importação de CSV (20 alunos) → criação de atividade (`EM13CNT101`) → submissão → nota `9.5` → intervenção com hash SHA-256 → reinício do processo. | **Secretaria**: importa CSV sintético da turma piloto pela interface do app.<br>**Professor**: lança chamada (< 90s) e nota.<br>**Coordenação**: registra intervenção.<br>Fechar e reabrir o app. | 100% dos dados mantidos intactos após encerramento do processo e reinicialização da máquina. |
| **3** | **Recuperação SQLite Operacional (DR)** | Validado na **Matriz Unificada de DR** (Seção 4) e testado em 5 cenários rigorosos de falha (`dr_resilience_verification_report.json`). Script transacional autônomo `restore_edge.bat` integrado ao pacote com pré-validação via `winsqlite3.dll`, exclusão mútua, staging sandbox e `restore_journal.json`. | Acionar o botão *"Diagnóstico & Integridade"* no menu técnico do aplicativo instalado, ou executar `restore_edge.bat` via Prompt de Comando padrão do Windows. | Banco ativo aprovado em `PRAGMA integrity_check = ok`, sem corrupção silenciosa. Recuperação instalada documentada. |
| **4** | **Segurança de Login, Sessão e RBAC** | Cookie `aquila_session` assinado com HMAC-SHA256 (3 partes), expurgo automático de cookie forjado em `middleware.ts`, e RBAC rígido em `packages/api/src/trpc.ts` e `handlers.ts`. | Efetuar login com as contas piloto (`prof.ricardo`, `coord.helena`, `aluno.lucas`). Tentar acessar telas/URLs alheias e inspecionar cookies. | Acessos indevidos recusados com `UNAUTHORIZED` ou `FORBIDDEN`. Cookie ilegível e zero tokens em URL ou logs. |
| **5** | **Controle de Exposição, CSP e Isolamento de Rede** | Removido `allow-file-access-from-files` em `main.ts`; CSP configurado; protocolo `aquila-asset://` confinado estritamente a `userData/photos` e `reports` (bloqueando path traversal); conectores cloud desativados (`AQUILA_ENABLE_CLOUD_CONNECTORS=false`). | Inspecionar chamadas de rede no painel de rede. Verificar que o app só escuta em interfaces autorizadas da LAN e que o acesso a arquivos do sistema é negado. | Retorno `403 Forbidden` para qualquer path traversal (`../../.auth_secret`); zero tráfego de dados para nuvem pública. |
| **6** | **Backup Agendado e Resiliência Operacional** | Rotina de backup emite manifesto `.manifest.json` com hash SHA-256; simulação de destino indisponível emite alerta estruturado `BACKUP_DESTINATION_FAILURE`. | Configurar backup para destino primário (disco local) e secundário (pendrive/storage). Simular desconexão do secundário e conferir alerta na UI. | Backup local íntegro gerado; alerta visível ao operador e registrado em log de auditoria caso um destino falhe. |
| **7** | **Atualização e Preservação de Dados** | Migração idempotente `v2.0 → v2.1.0` testada com backup prévio automático de snapshot (`pre_migration_v2.1.0.bak`), preservando notas e histórico escolar. | Aplicar a nova versão sobre base sintética prévia e validar o snapshot de contingência. | Banco de dados migrado sem perda de notas. Snapshot pronto para rollback imediato caso necessário. |
| **8** | **Usabilidade Docente, Contingência e Parada** | Interface do professor simplificada para chamada em < 90s (`Ctrl+Shift+C`) e visualização A4 em tempo real (Exam Foundry). Folha de presença em papel pronta para impressão. | O professor executa uma chamada completa de teste em menos de 90 segundos e imprime a ata oficial de contingência da LDB em 1 clique. | Chamada confirmada sem lentidão; lista A4 em papel validada para caso de falta de energia. |

---

## 4. Matriz Unificada de DR e Recuperação Operacional SQLite

A resiliência do SQLite em modo `WAL` é consolidada nos cinco cenários técnicos testados e validados na suíte automatizada de resiliência ([`dr_resilience_verification_report.json`](../test-results/dr_resilience_verification_report.json)):

| Cenário de Falha / Recuperação | O que foi testado em Bancada Técnica | Comportamento Verificado do Sistema | Métrica Medida / Esperada | Procedimento na Máquina da Escola |
| :--- | :--- | :--- | :--- | :--- |
| **1. Rejeição de Candidato Corrompido Pré-Swap** | Candidato com bytes inválidos (12 KB de lixo binário) e arquivo truncado (500 bytes) | Validação do Magic Header (`SQLite format 3`) e `PRAGMA integrity_check` via `winsqlite3.dll` aborta imediatamente antes do swap; banco ativo preservado intacto | **RTO < 50 ms** (aborto imediato); **RPO = 0** (banco ativo intocado); Código de saída 3 | Execução de `restore_edge.bat "arquivo_corrompido.db"` rejeita e emite código de saída 3 sem tocar em `aquila.db`. |
| **2. Exclusão Mútua contra Processos Ativos** | Tentativa de restauração com `Aquila Pro.exe` ou `electron` em execução | Bloqueio preventivo antes de qualquer leitura ou cópia para impedir corrupção de lock SQLite | **RTO = Imediato**; Código de saída 5; banco ativo protegido | `restore_edge.bat` notifica o operador e solicita o fechamento do app antes de prosseguir. |
| **3. Snapshot Cautelar com Validação de Bytes** | Criação de snapshot pré-restauração antes de modificar a base ativa | Validação estrita do comprimento de bytes do snapshot contra o original; se houver divergência (ex: disco cheio), a operação é cancelada | **RPO = 0**; Código de saída 4; rollback prévio garantido | Snapshot gravado em `%APPDATA%\AquilaPro\snapshots\pre_restore_[TIMESTAMP]`. |
| **4. Staging Sandbox e Substituição Atômica** | Cópia do candidato para staging (`staging_restore.db`), conferência de tamanho e swap via renomeação de arquivos | WAL/SHM limpos, banco ativo renomeado atomicamente para `.old` e substituído; rollback instantâneo se falhar | **RTO < 2s**; integridade do banco anterior preservada integralmente | `restore_edge.bat` gerencia todo o swap e limpa arquivos transitórios automaticamente. |
| **5. Recuperação Pós-Interrupção Súbita (Crash Recovery)** | Simulação de desligamento ou falta de energia no meio da fase `REPLACING` com diário persistente | A rotina de boot recovery (ou próxima execução do script) lê `restore_journal.json` e reverte automaticamente para o snapshot íntegro | **RTO < 1s** no boot; **RPO = zero corrupção**; diário pendente saneado | Inicialização normal do aplicativo; rotina em `Database.initialize()` cura o estado automaticamente. |

---

## 5. Matriz Rígida de Aceitação de Segurança por Perfil (RBAC)

| Perfil Testado | Ação Proibida Tentada | Resultado Esperado do Sistema | Evidência de Fechamento |
| :--- | :--- | :--- | :--- |
| **Aluno** | Consultar respostas, notas ou dados de outro estudante manipulando IDs na API/IPC | **Recusa Imediata (`FORBIDDEN` / `UNAUTHORIZED`)**. Nenhum dado do outro aluno é retornado. | Teste automatizado em `studentGradeScope.ts` e `api.test.ts`. |
| **Professor** | Alterar chamada ou notas de turma fora de sua atribuição docente | **Bloqueio no Backend/IPC**. A operação é rejeitada e registrada em auditoria. | Validação de escopo em `handlers.ts` e `AttendanceCall.tsx`. |
| **Secretaria** | Aprovar intervenção pedagógica de risco ou estorno sem autorização | **Ação Não Autorizada**. Operação restrita à Coordenação/Direção. | RBAC middleware `adminProcedure` em `packages/api/src/trpc.ts`. |
| **Sem Sessão** | Acessar qualquer endpoint ou procedure protegida | **Redirecionamento para Login (`UNAUTHORIZED`)**. | Cookie ausente resulta em HTTP 401 / Login redirect. |
| **Sessão Adulterada** | Manipular assinatura HMAC-SHA256 do cookie `aquila_session` | **Destruição Imediata do Cookie**. Sessão invalidada sem processar a requisição. | Teste unitário em `apps/web/src/lib/__tests__/session.test.ts`. |

---

## 6. Procedimento Autônomo e Transacional de Restauração (`restore_edge.bat`)

O pacote de distribuição autônomo `apps/electron/release_v2_2/win-unpacked` inclui nativamente os utilitários [`restore_edge.bat`](file:///c:/aquila/apps/electron/release_v2_2/win-unpacked/restore_edge.bat) e [`restore_edge.ps1`](file:///c:/aquila/apps/electron/release_v2_2/win-unpacked/restore_edge.ps1), implementando as garantias transacionais exigidas:

1. **Zero Dependências de Ferramentas de Desenvolvimento:** Opera utilizando exclusivamente o PowerShell padrão do Windows 10/11 e o motor nativo `winsqlite3.dll` pré-instalado em `C:\Windows\System32\winsqlite3.dll` no Windows 10 e 11 Pro, sem requerer Node.js, Python, Git ou compiladores na máquina escolar.
2. **Exclusão Mútua Garantida (Etapa 1):** Verifica se `Aquila Pro.exe` ou processos Electron estão ativos antes de abrir arquivos SQLite. Se houver processo rodando, aborta imediatamente com código 5, evitando corrupção de lock.
3. **Pré-validação Estrita de Integridade (Etapa 3):**
   - Valida assinatura binária do Magic Header (16 bytes iniciais: `SQLite format 3\0`);
   - Rejeita arquivos menores ou iguais a 4.096 bytes;
   - Executa `PRAGMA integrity_check;` via `winsqlite3.dll`. Se retornar qualquer valor diferente de `"ok"`, o arquivo é imediatamente recusado com código 3 sem que o banco ativo seja tocado.
4. **Snapshot Cautelar com Validação de Bytes (Etapa 4):** Copia `aquila.db`, `aquila.db-wal` e `aquila.db-shm` para `%APPDATA%\AquilaPro\snapshots\pre_restore_[TIMESTAMP]`. Valida se o tamanho do arquivo copiado corresponde exatamente ao arquivo de origem antes de permitir o swap.
5. **Diário Transacional Persistente em Disco (Etapa 5):** Grava `%APPDATA%\AquilaPro\restore_journal.json` marcando o progresso das fases (`PREPARING_REPLACEMENT` → `READY_FOR_REPLACE` → `REPLACING` → `COMPLETED`).
6. **Staging em Sandbox & Substituição Atômica (Etapa 6):** O candidato é primeiro copiado para `staging_restore.db`, verificado e então promovido via renomeação de arquivos atômica no sistema operacional, com remoção segura de resíduos WAL/SHM.
7. **Pós-Validação & Rollback Automático (Etapa 7):** Executa `PRAGMA integrity_check` no banco recém-promovido. Em caso de falha, aciona rollback automático a partir do snapshot. Caso aprove, calcula o checksum SHA-256 e finaliza o diário.
8. **Recuperação de Interrupção Súbita no Boot (Boot Recovery):** Se o computador sofrer queda de energia durante o swap, o aplicativo em `Database.initialize()` (e o script `restore_edge.bat` na inicialização) identifica o `restore_journal.json` pendente e realiza o rollback determinístico para o snapshot pré-swap.

---

## 7. Gates Formais de Governança e Transição para Dados Reais

A migração de testes sintéticos para o ambiente escolar deve respeitar obrigatoriamente a seguinte sequência de Gates (G1-A, G1-B, G2 a G5):

```mermaid
flowchart LR
    G1A["G1-A: Bancada Técnica Automatizada<br/>(8 Prioridades + PATH Sanitizado + DR 5/5)"] --> G1B["G1-B: Validação em Windows Físico Limpo<br/>(Pacote win-unpacked + Jornada + Usabilidade)"]
    G1B --> G2["G2: Aceite Formal Conjunto<br/>(Direção Escolar + DPO + TI)"]
    G2 --> G3["G3: Termo LGPD e Esclarecimento<br/>(Famílias da Turma)"]
    G3 --> G4["G4: Importação Assistida Restrita<br/>(1 Turma / 30 Alunos)"]
    G4 --> G5["G5: Início do Piloto Assistido<br/>(1 Semana de Campo)"]
```

- **Gate G1-A (Bancada Técnica e Verificações Automatizadas):** Concluído com sucesso na engenharia:
  - 8 suítes operacionais aprovadas (`h01_8_operational_priorities_report.json`);
  - Teste de isolamento de runtime em PATH sanitizado aprovado (`clean_runtime_h01_evidence.json`);
  - Suíte de resiliência e recuperação DR aprovada nos 5 cenários (`dr_resilience_verification_report.json`);
  - Hashes dos componentes comparados e validados contra o manifesto.
- **Gate G1-B (Validação em Windows Físico Limpo do Ambiente Escolar):** Etapa mandatória pré-G2 na máquina de destino:
  - Cópia do pacote `win-unpacked` para estação Windows 10/11 Pro física da escola (sem Node/Git);
  - Inicialização limpa do `Aquila Pro.exe` sem erros nativos de DLL/ABI;
  - Execução da jornada escolar completa de 20 alunos sintéticos;
  - Ensaio do script `restore_edge.bat` na estação física;
  - Teste de usabilidade docente de chamada (< 90s).
- **Gate G2 (Aceite Formal Conjunto de Governança):** Reunião presencial com a Direção Escolar, DPO da instituição e Responsável de TI para assinatura formal da Ata de Homologação da Candidata v2.1.0, **condicionada formalmente à aprovação integral dos Gates G1-A e G1-B**.
- **Gate G3 (Consentimento e Informação às Famílias):** Envio de comunicado formal e termo de esclarecimento (LGPD Art. 14) aos responsáveis da turma piloto selecionada, com garantia de alternativa via crachá/chamada nominal.
- **Gate G4 (Importação Assistida Restrita):** A secretaria escolar realiza a importação assistida **exclusivamente dos dados da turma piloto autorizada (máximo 30 estudantes)**, na presença do DPO/TI. Nenhuma outra turma é inserida nesta fase.
- **Gate G5 (Início da Operação Assistida):** Início da contagem de 5 dias úteis de piloto com suporte presencial da equipe técnica.

---

## 8. Critérios Objetivos de Parada Imediata (Stop Criteria / No-Go)

Caso qualquer uma das seguintes ocorrências seja detectada durante a bancada presencial ou no decorrer da semana piloto, a operação do sistema deve ser **imediatamente interrompida**, retornando-se à contingência em papel:

1. **Integridade de Banco Comprometida:** Qualquer retorno diferente de `ok` ao executar `PRAGMA integrity_check` no banco SQLite local.
2. **Falha de Isolamento entre Estudantes ou Turmas:** Qualquer ocorrência em que um aluno consiga visualizar nota, presença ou atividade de outro estudante, ou professor visualize turma não atribuída.
3. **Discrepância de Notas ou Frequência:** Qualquer divergência não explicada entre o dado registrado pelo professor e o dado persistido no banco de dados ou exibido no boletim.
4. **Falha Persistente de Backup:** Falha no backup diário primário ou secundário que não seja resolvida em até 4 horas úteis pela equipe de TI.
5. **Instabilidade Térmica ou Travamento:** Congelamento do aplicativo que exija finalização forçada por gerenciador de tarefas mais de 2 vezes no mesmo turno.

---

## 9. Cronograma Sequencial de Homologação em 9 Etapas

| Etapa | Ação Executiva | Responsável | Condição Mandatória para Avançar |
| :---: | :--- | :--- | :--- |
| **1** | **Revisão Documental v2.1.1** | Equipe Antigravity | Dossiê aprovado sem contradições de escopo, commits ou artefato. |
| **2** | **Conferência Criptográfica de Relatórios** | Engenharia / QA | Vínculo explícito de todos os relatórios JSON e binários com a tríade de commits. |
| **3** | **Validação em Windows Limpo (Físico - Gate G1-B)** | TI da Escola / QA | Inicialização e uso de `win-unpacked` na máquina física da escola sem ferramentas dev. |
| **4** | **Ensaio de Restauração Instalada** | TI da Escola | Teste de recuperação transacional executado via `restore_edge.bat` na estação física. |
| **5** | **Homologação de Capacidade Sintética** | Laboratório Técnico | Teste de carga de 500 alunos mantido estritamente em ambiente de bancada. |
| **6** | **Avaliação de Usabilidade com Professor** | Docente Piloto | Realização de chamada em < 90s e aprovação do fluxo de diário e impressão. |
| **7** | **Ata de Aceite Conjunto (Gate G2)** | Direção, DPO e TI | Documento formal assinado autorizando a entrada da turma piloto após G1-A e G1-B. |
| **8** | **Execução da Semana Piloto H-01 (Gate G5)** | Escola / Suporte | 5 dias de operação assistida na turma selecionada (até 30 alunos). |
| **9** | **Avaliação e Decisão de Expansão** | Colegiado Escolar | Decisão de expansão para as demais 19 turmas baseada em dados reais do piloto. |

---

*Elaborado para homologação presencial. Aceite operacional pendente das assinaturas formais identificadas nesta versão (Direção Escolar, DPO e TI).*
