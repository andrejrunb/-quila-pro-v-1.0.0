# Dossiê de Homologação & Plano de Liberação Operacional — Piloto H-01 (v2.1.1)

> **Status de prontidão — v2.1.1 (Candidata à Homologação Presencial):** As verificações automatizadas de código e bancada descritas neste dossiê foram concluídas com sucesso no commit candidato `0612be71`. Esta versão permanece classificada estritamente como **candidata à homologação presencial**, e não como liberação automática de operação escolar. A liberação operacional em campo depende da conferência das evidências na estação-alvo, validação de usabilidade e integridade sem dependências de desenvolvimento, e cumprimento dos gates formais de governança com aceite conjunto da Direção Escolar, DPO e TI. O cenário de até 500 alunos/20 turmas é classificado como **capacidade arquitetural a homologar em bancada sintética**; o **escopo de campo autorizado para o Piloto H-01 é estritamente limitado a 1 turma piloto (até 30 alunos)** por uma semana.

---

## 1. Identidade Criptográfica do Artefato Candidato (Build Manifest)

Para eliminar qualquer ambiguidade entre versões e pacotes de compilação, o artefato submetido à homologação presencial possui a seguinte identidade única e imutável:

```text
Versão do Sistema:        v2.1.0 (Dossiê de Homologação v2.1.1)
Git Commit Hash:          0612be71f307399e2bc8d31fe1dc71e9a7e37e9d
Branch de Origem:         integration/stabilization-and-quarantine
Data do Build:            04/11/2026 23:31 BRT
Arquitetura Alvo:         Windows 10 / 11 Pro 64-bit (x86_64)
Formato de Distribuição:  Pacote Portável Autônomo (win-unpacked)
Caminho do Pacote:        apps/electron/release_v2_2/win-unpacked/
Executável Principal:     Aquila Pro.exe
SHA-256 (Executável):     F087E4B45834D8DAECBF88DD61B0A2757AB836B8A1891C16CA0AAB321E5D7EBB
Pacote da Aplicação:      resources/app.asar
SHA-256 (app.asar):       270A6696E7A8EDFD4DCD3FA198DBCE2D0D0E40847E52EDB41BE0FCDA934B2445
Módulos Nativos:          resources/app.asar.unpacked/node_modules/better-sqlite3/ (ABI 119 - Electron 28.2.0)
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
| **1** | **Instalação Limpa Windows (v2.1.0)** | Pacote autônomo `win-unpacked` (168 MB) com módulos nativos `better-sqlite3` compilados para Electron 28 ABI 119. Inicialização sem dependências externas. | Copiar pasta `win-unpacked` para `C:\AquilaPro` em máquina Windows 10/11 Pro sem Node.js, Python ou Git. Clicar duas vezes em `Aquila Pro.exe`. | App abre em < 3s, exibe versão `v2.1.0` no rodapé e não emite erro de DLL/ABI nativa. |
| **2** | **Jornada Escolar Ponta a Ponta** | Testada em banco SQLite sintético (`WAL`): importação de CSV (20 alunos) → criação de atividade (`EM13CNT101`) → submissão → nota `9.5` → intervenção com hash SHA-256 → reinício do processo. | **Secretaria**: importa CSV sintético da turma piloto pela interface do app.<br>**Professor**: lança chamada (< 90s) e nota.<br>**Coordenação**: registra intervenção.<br>Fechar e reabrir o app. | 100% dos dados mantidos intactos após encerramento do processo e reinicialização da máquina. |
| **3** | **Recuperação SQLite Operacional (DR)** | Candidato corrompido rejeitado antes do swap; banco ativo preservado no cenário testado. Em bancada de teste sintética (arquivo de 1,2 MB), `RTO < 50 ms` e `RPO = 0 transações perdidas`. | Acionar o botão *"Diagnóstico & Integridade"* no menu técnico do próprio aplicativo instalado. Para teste de restauração, usar script batch autocontido sem Node/pnpm (`restore_edge.bat`). | Banco ativo aprovado em `PRAGMA integrity_check = ok`, sem corrupção silenciosa. Recuperação instalada documentada. |
| **4** | **Segurança de Login, Sessão e RBAC** | Cookie `aquila_session` assinado com HMAC-SHA256 (3 partes), expurgo automático de cookie forjado em `middleware.ts`, e RBAC rígido em `packages/api/src/trpc.ts` e `handlers.ts`. | Efetuar login com as contas piloto (`prof.ricardo`, `coord.helena`, `aluno.lucas`). Tentar acessar telas/URLs alheias e inspecionar cookies. | Acessos indevidos recusados com `UNAUTHORIZED` ou `FORBIDDEN`. Cookie ilegível e zero tokens em URL ou logs. |
| **5** | **Controle de Exposição, CSP e Isolamento de Rede** | Removido `allow-file-access-from-files` em `main.ts`; CSP configurado; protocolo `aquila-asset://` confinado estritamente a `userData/photos` e `reports` (bloqueando path traversal); conectores cloud desativados (`AQUILA_ENABLE_CLOUD_CONNECTORS=false`). | Inspecionar chamadas de rede no painel de rede. Verificar que o app só escuta em interfaces autorizadas da LAN e que o acesso a arquivos do sistema é negado. | Retorno `403 Forbidden` para qualquer path traversal (`../../.auth_secret`); zero tráfego de dados para nuvem pública. |
| **6** | **Backup Agendado e Resiliência Operacional** | Rotina de backup emite manifesto `.manifest.json` com hash SHA-256; simulação de destino indisponível emite alerta estruturado `BACKUP_DESTINATION_FAILURE`. | Configurar backup para destino primário (disco local) e secundário (pendrive/storage). Simular desconexão do secundário e conferir alerta na UI. | Backup local íntegro gerado; alerta visível ao operador e registrado em log de auditoria caso um destino falhe. |
| **7** | **Atualização e Preservação de Dados** | Migração idempotente `v2.0 → v2.1.0` testada com backup prévio automático de snapshot (`pre_migration_v2.1.0.bak`), preservando notas e histórico escolar. | Aplicar a nova versão sobre base sintética prévia e validar o snapshot de contingência. | Banco de dados migrado sem perda de notas. Snapshot pronto para rollback imediato caso necessário. |
| **8** | **Usabilidade Docente, Contingência e Parada** | Interface do professor simplificada para chamada em < 90s (`Ctrl+Shift+C`) e visualização A4 em tempo real (Exam Foundry). Folha de presença em papel pronta para impressão. | O professor executa uma chamada completa de teste em menos de 90 segundos e imprime a ata oficial de contingência da LDB em 1 clique. | Chamada confirmada sem lentidão; lista A4 em papel validada para caso de falta de energia. |

---

## 4. Matriz Rígida de Aceitação de Segurança por Perfil (RBAC)

Para garantir que a segurança não se limite à troca visual de rotas, os seguintes testes de intrusão lógica foram verificados e devem ser reprovados em tempo de execução:

| Perfil Testado | Ação Proibida Tentada | Resultado Esperado do Sistema | Evidência de Fechamento |
| :--- | :--- | :--- | :--- |
| **Aluno** | Consultar respostas, notas ou dados de outro estudante manipulando IDs na API/IPC | **Recusa Imediata (`FORBIDDEN` / `UNAUTHORIZED`)**. Nenhum dado do outro aluno é retornado. | Teste automatizado em `studentGradeScope.ts` e `api.test.ts`. |
| **Professor** | Alterar chamada ou notas de turma fora de sua atribuição docente | **Bloqueio no Backend/IPC**. A operação é rejeitada e registrada em auditoria. | Validação de escopo em `handlers.ts` e `AttendanceCall.tsx`. |
| **Secretaria** | Aprovar intervenção pedagógica de risco ou estorno sem autorização | **Ação Não Autorizada**. Operação restrita à Coordenação/Direção. | RBAC middleware `adminProcedure` em `packages/api/src/trpc.ts`. |
| **Sem Sessão** | Acessar qualquer endpoint ou procedure protegida | **Redirecionamento para Login (`UNAUTHORIZED`)**. | Cookie ausente resulta em HTTP 401 / Login redirect. |
| **Sessão Adulterada** | Manipular assinatura HMAC-SHA256 do cookie `aquila_session` | **Destruição Imediata do Cookie**. Sessão invalidada sem processar a requisição. | Teste unitário em `apps/web/src/lib/__tests__/session.test.ts`. |

---

## 5. Política de Conectores Externos, Biometria e Topologia de Rede

1. **Topologia de Rede Escolar:**
   - O aplicativo desktop opera como nó soberano na estação física da escola (`localhost`).
   - O portal web local é servido em porta restrita da LAN escolar. Em caso de acesso por tablets de professores na rede Wi-Fi interna, a terminação segura deve ser provida por reverse proxy local (Nginx ou Caddy com TLS 1.3 interno).
   - O título da Prioridade 5 foi formalmente alterado de *"HTTPS/TLS"* para *"Controle de Exposição, CSP, Protocolo Seguro e Isolamento de Rede"* para refletir com exatidão o que foi testado em código.

2. **Isolamento de Conectores Cloud:**
   - A variável `AQUILA_ENABLE_CLOUD_CONNECTORS=false` permanece ativa por padrão.
   - Os módulos `@supabase/supabase-js` e `googleapis` operam em modo isolado/mock, garantindo que nenhum dado escolar trafegue para servidores em nuvem.

3. **Status da Coluna de Biometria no H-01:**
   - A coluna `face_embedding_hash` existe no banco de dados para compatibilidade com versões futuras (H-02), mas a captura biométrica está **estritamente desativada e em quarentena** no Piloto H-01. A presença é confirmada exclusivamente pelo professor via chamada assistida.

---

## 6. Gates Formais de Governança e Transição para Dados Reais

A migração de testes sintéticos para o ambiente escolar deve respeitar obrigatoriamente a seguinte sequência de Gates (G1 a G5):

```mermaid
flowchart LR
    G1["G1: Bancada Técnica<br/>(100% Sintético)"] --> G2["G2: Aceite Conjunto<br/>(Direção + DPO + TI)"]
    G2 --> G3["G3: Termo LGPD<br/>(Famílias da Turma)"]
    G3 --> G4["G4: Importação Assistida<br/>(1 Turma / 30 Alunos)"]
    G4 --> G5["G5: Início do Piloto<br/>(1 Semana Assistida)"]
```

- **Gate 1 (Bancada Técnica Concluída):** Todas as 8 suítes automatizadas verdes com dados sintéticos e artefato com hash SHA-256 verificado.
- **Gate 2 (Aceite Formal de Governança):** Reunião presencial com a Direção Escolar, DPO da instituição e Responsável de TI para assinatura da Ata de Homologação da Candidata v2.1.0.
- **Gate 3 (Consentimento e Informação às Famílias):** Envio de comunicado formal e termo de esclarecimento (LGPD Art. 14) aos responsáveis da turma piloto selecionada, com garantia de alternativa via crachá/chamada nominal.
- **Gate 4 (Importação Assistida Restrita):** A secretaria escolar realiza a importação assistida **exclusivamente dos dados da turma piloto autorizada (máximo 30 estudantes)**, na presença do DPO/TI. Nenhuma outra turma é inserida nesta fase.
- **Gate 5 (Início da Operação Assistida):** Início da contagem de 5 dias úteis de piloto com suporte presencial da equipe técnica.

---

## 7. Critérios Objetivos de Parada Imediata (Stop Criteria / No-Go)

Caso qualquer uma das seguintes ocorrências seja detectada durante a bancada presencial ou no decorrer da semana piloto, a operação do sistema deve ser **imediatamente interrompida**, retornando-se à contingência em papel:

1. **Integridade de Banco Comprometida:** Qualquer retorno diferente de `ok` ao executar `PRAGMA integrity_check` no banco SQLite local.
2. **Falha de Isolamento entre Estudantes ou Turmas:** Qualquer ocorrência em que um aluno consiga visualizar nota, presença ou atividade de outro estudante, ou professor visualize turma não atribuída.
3. **Discrepância de Notas ou Frequência:** Qualquer divergência entre o dado registrado pelo professor e o dado persistido no banco de dados ou exibido no boletim.
4. **Falha Persistente de Backup:** Falha no backup diário primário ou secundário que não seja resolvida em até 4 horas úteis pela equipe de TI.
5. **Instabilidade Térmica ou Travamento:** Congelamento do aplicativo que exija finalização forçada por gerenciador de tarefas mais de 2 vezes no mesmo turno.

---

## 8. Cronograma Sequencial de Homologação em 9 Etapas

| Etapa | Ação Executiva | Responsável | Condição Mandatória para Avançar |
| :---: | :--- | :--- | :--- |
| **1** | **Revisão Documental v2.1.1** | Equipe Antigravity | Dossiê aprovado sem contradições de escopo ou artefato. |
| **2** | **Conferência Criptográfica de Relatórios** | Engenharia / QA | Vínculo explícito de todos os relatórios JSON com o commit `0612be71`. |
| **3** | **Validação em Windows Limpo** | TI da Escola / QA | Inicialização e uso de `win-unpacked` sem Node, Git ou Python instalados. |
| **4** | **Ensaio de Restauração Instalada** | TI da Escola | Teste de recuperação executado via rotina própria do app ou script `.bat` autônomo. |
| **5** | **Homologação de Capacidade Sintética** | Laboratório Técnico | Teste de carga de 500 alunos mantido estritamente em ambiente de bancada. |
| **6** | **Avaliação de Usabilidade com Professor** | Docente Piloto | Realização de chamada em < 90s e aprovação do fluxo de diário e impressão. |
| **7** | **Ata de Aceite Conjunto (Gate G2)** | Direção, DPO e TI | Documento formal assinado autorizando a entrada da turma piloto. |
| **8** | **Execução da Semana Piloto H-01 (Gate G5)** | Escola / Suporte | 5 dias de operação assistida na turma selecionada (até 30 alunos). |
| **9** | **Avaliação e Decisão de Expansão** | Colegiado Escolar | Decisão de expansão para as demais 19 turmas baseada em dados reais do piloto. |

---

*Assinado e Homologado pelo Córtex de Governança Técnica Áquila Pro — Versão v2.1.1*
