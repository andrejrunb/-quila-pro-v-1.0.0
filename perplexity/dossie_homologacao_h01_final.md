# Dossiê de Homologação & Plano de Liberação Operacional — Piloto H-01 (v2.1.0)

> **Status de Prontidão Técnica (v2.1.0):** Todas as correções críticas (**P0, P1 e P2**) da auditoria do Monorepo (`apps/electron`, `packages/api`, `packages/db`, `SECURITY.md`, `LICENSE`) e da auditoria do portal web (`apps/web`), bem como a suíte automatizada das **8 Prioridades Operacionais do Piloto H-01**, foram executadas e validadas com **0 erros e 0 warnings de lint** e **100% dos testes aprovados**.

---

## 1. Matriz das 8 Prioridades de Liberação do Piloto H-01

A tabela abaixo consolida o plano executivo e a evidência técnica verificada para cada uma das 8 prioridades necessárias para a homologação de bancada e liberação assistida na escola-piloto (**20 salas / 500 alunos**):

| Prioridade | Item Operacional | O que foi verificado em código/bancada | Procedimento Final na Máquina da Escola | Critério de Fechamento & Evidência |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **Instalação limpa Windows (v2.1.0)** | Binário `Aquila Pro.exe` (168,26 MB), `app.asar` atualizado in-place com `v2.1.0` e módulo nativo `better_sqlite3.node` (ABI 119 Electron 28) desempacotado. | Copiar/instalar pacote em estação Windows 10/11 Pro limpa (sem Node, Python ou Git) e iniciar o app. | Inicialização limpa, versão `v2.1.0` visível e log sem erro de módulo nativo (`test-results/h01_8_operational_priorities_report.json`). |
| **2** | **Jornada escolar ponta a ponta** | Testada em banco SQLite sintético (`WAL`): importação de lote CSV (20 alunos) → criação de atividade (`EM13CNT101`) → submissão do aluno → revisão de nota (`9.5`) e intervenção com hash SHA-256 → reinício do banco. | Secretaria importa CSV sintético pela UI → Docente lança atividade e chamada → Aluno responde → Coordenação registra intervenção e reinicia o app. | 100% dos registros preservados após fechar e reabrir o aplicativo. |
| **3** | **Recuperação SQLite operacional (DR)** | Simulado candidato de restauração truncado/corrompido (`CORRUPT_PARTIAL_WRITE`) antes do swap; validado bloqueio pré-swap, `PRAGMA integrity_check = ok`, **RTO < 50 ms** e **RPO = 0 transações perdidas**. | Executar `pnpm run restore:drill` na estação local antes do início das aulas. | Banco íntegro (`ok`), sem perda silenciosa de dados. |
| **4** | **Segurança de login, sessão e autorização** | Cookie `aquila_session` assinado com HMAC-SHA256 (3 partes), expurgo automático de cookie adulterado em `middleware.ts`, RBAC em `packages/api/src/trpc.ts` e validação de série/turma no IPC (`handlers.ts`). | Testar login por perfil (`professor`, `coordenacao`, `aluno`) e tentativa de troca manual de rota/série. | Acessos cruzados recusados (`UNAUTHORIZED` / `FORBIDDEN`) e zero tokens em URL. |
| **5** | **HTTPS/TLS, CSP e não-exposição** | Removido `allow-file-access-from-files` de `main.ts`; configurado CSP estrito e protocolo `aquila-asset://` confinado a `userData/photos` e `userData/reports` em `window.ts` (bloqueando `../../.auth_secret` e `../backups/aquila.db`). | Inspecionar headers e tentar acesso a caminhos fora do escopo autorizado. | Retorno `403 Forbidden` para qualquer tentativa de path traversal; conectores de nuvem bloqueados por padrão (`AQUILA_ENABLE_CLOUD_CONNECTORS=false`). |
| **6** | **Backup agendado e falha operacional** | Rotina de backup gera manifesto `.manifest.json` com hash SHA-256; falha simulada de destino emite alerta crítico estruturado (`BACKUP_DESTINATION_FAILURE`). | Executar backup local agendado e simular diretório de destino indisponível. | Alerta visível ao operador e arquivo de backup íntegro verificável. |
| **7** | **Atualização e preservação de dados** | Testada migração idempotente `v2.0 → v2.1.0` com snapshot prévio automático, preservando contas, notas bimestrais e adicionando `face_embedding_hash` e `zero_bypass_audits`. | Aplicar atualização sobre base sintética populada e conferir notas/turmas. | Dados preservados integralmente e snapshot de rollback pronto. |
| **8** | **Usabilidade, continuidade em papel e parada** | Menus simplificados por perfil (`ROLE_MENUS`) em `PortalLayout.tsx`, diário/chamada em papel para contingência e critérios objetivos de parada (*No-Go*). | Simular aula com queda de energia/rede usando folha de contingência e posterior transcrição. | Operação escolar contínua sem bloqueio de sala de aula. |

---

## 2. Plano de Execução Presencial na Bancada Escolar (Roteiro Go-Live H-01)

### Fase 1 — Preparação da Estação Local (T-48h)
1. Provisionar a estação local Windows 10/11 Pro da escola (mínimo 8 GB RAM, SSD com 20 GB livres, conectada à LAN local).
2. Copiar a pasta empacotada `apps/electron/release_v2_2/win-unpacked` ou executar o instalador `AquilaPro-Setup-2.1.0.exe`.
3. Verificar que a variável `AQUILA_ENABLE_CLOUD_CONNECTORS` permanece ausente ou `false` (modo estritamente *Offline-First*).
4. Iniciar o aplicativo e confirmar no rodapé/sobre a versão **`v2.1.0`** e a criação automática de `.auth_secret` (256 bits) e `aquila.db` (modo `WAL`) em `%APPDATA%\AquilaPro`.

### Fase 2 — Validação Assistida com Secretaria, Professor e Coordenação (T-24h)
1. **Secretaria:** Importar planilha CSV da unidade piloto (até 20 turmas / 500 alunos) e validar a prévia de inconsistências antes de confirmar o lote.
2. **Professor:** Abrir a turma, conferir o mapa visual 6×5 (`SeatingIntelligence.tsx`), registrar a chamada assistida (`AttendanceCall.tsx`) com confirmação humana e lançar notas do bimestre ativo (`TeacherGradebook.tsx`).
3. **Coordenação:** Verificar o encadeamento automático na linha do tempo operacional do estudante (`Presença → Atraso → Ocorrência → Justificativa → Ação`) e registrar uma intervenção pedagógica.

### Fase 3 — Contingência em Papel e Critérios de Parada (Go / No-Go)
- **Procedimento de Contingência em Papel:** Caso a estação local sofra desligamento elétrico ou manutenção durante o horário de aula, o professor utiliza a lista nominal impressa A4 da turma e realiza a transcrição assistida no retorno do sistema.
- **Critérios de Parada Imediata (*Stop Criteria*):**
  1. Qualquer falha em `PRAGMA integrity_check` no banco SQLite local.
  2. Qualquer evidência de visualização de dados de outra série/turma por perfil de estudante.
  3. Falha simultânea na gravação de backup primário e secundário sem resolução pela TI local.

---

## 3. Resumo das Suítes Automatizadas Verificadas

- `test-results/h01_8_operational_priorities_report.json`: **8/8 Prioridades Operacionais PASS**.
- `test-results/pp_mission_verification_report.json`: **12/12 Verificações da Missão PP PASS**.
- `test-results/collector_10_fixtures_report.json`: **10/10 Fixtures Sintéticas do Coletor H-01 PASS**.
- `test-results/colab_harness_verification_report.json`: **8/8 Testes do Harness PC + Colab PASS**.
- **Web Lint & Tests (`@aquila/web`):** **0 erros, 0 warnings** no ESLint e **27/27 testes unitários PASS**.
- **API Tests (`@aquila/api`):** **4/4 testes unitários tRPC/RBAC PASS**.
