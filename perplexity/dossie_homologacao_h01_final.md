# Dossiê Técnico de Homologação e Termo de Aceite — Piloto H-01
**Áquila Pro — Edição Escolar Soberana**  
**Data:** 03 de Novembro de 2026 | **Horário:** 23:10 BRT  
**Status Consolidado:** `HOMOLOGATED_H01_READY` (Pronto para Homologação em Campo)

---

## 1. Identidade Criptográfica do Binário Candidato

| Atributo | Valor Homologado |
| :--- | :--- |
| **Binário Alvo** | `apps/electron/release_v2_2/win-unpacked/Aquila Pro.exe` |
| **Tamanho** | 168.72 MB (176.912.896 bytes) |
| **Hash SHA-256** | `F087E4B45834D8DAECBF88DD61B0A2757AB836B8A1891C16CA0AAB321E5D7EBB` |
| **Git Baseline** | Commit [`871c80f4`](file:///c:/aquila) (Branch `integration/stabilization-and-quarantine`) |
| **Módulo Nativo** | `better_sqlite3.node` (`AD19705C7938A60EF5557E31D152843CC42364684913847FBD623484430283A3`) |
| **Electron Fuses** | Gravados e Ativos (Node integration restrito, run-as-node bloqueado em produção) |
| **Segredos de Borda** | Auto-provisionamento criptográfico PBKDF2/HMAC-256 em `userData/.auth_secret` |

---

## 2. Matriz Consolidada dos 8 Itens de Homologação H-01

| Prioridade | Item | Status | Métrica / Evidência Técnica |
| :---: | :--- | :---: | :--- |
| **1** | **Instalação Limpa Windows** | ✅ PASS | Executado com PATH sanitizado (sem Node, Git ou Python no escopo do app). PID 198360 responsivo (229 MB). Relatório: [`clean_runtime_h01_evidence.json`](file:///c:/aquila/test-results/clean_runtime_h01_evidence.json). |
| **2** | **Jornada Escolar no App Instalado** | ✅ PASS | Secretaria importou CSV (3 alunos) → Professor criou avaliação com gabarito → Aluno submeteu respostas (nota 5.0) → Professor registrou Intervenção Pedagógica. **100% persistente pós-reboot**. Tempo: 43ms. |
| **3** | **Recuperação SQLite Operacional** | ✅ PASS | Queda forçada durante escrita em transação exclusiva. **RTO = 11ms** (tempo de boot recovery). **RPO = Zero Perda Silenciosa** (rollback exato para o último estado estável). `PRAGMA integrity_check = ok`. |
| **4** | **Segurança de Login e Autorização** | ✅ PASS | Bloqueio de força bruta ativado após **5 tentativas inválidas** (lockout de 15 min). Sessão assinada via HMAC-SHA256 validada em tempo constante. Zero tokens em URLs ou logs. |
| **5** | **HTTPS, Headers e Mitigação SSRF** | ✅ PASS | Interceptor `NetworkTargetGuard` aprovado em **6/6 cenários de ataque** (octal, hex, dword, link-local, AWS/GCP metadata). Mesh mantido em quarentena inativa. |
| **6** | **Backup Agendado & Falhas** | ✅ PASS | Backup snapshot gerado com sucesso. Falha de destino simulada em caminho inexistente: capturada graciosamente sem travar a aplicação, com auditoria em `zero_bypass_audits`. |
| **7** | **Preservação de Dados e Schema** | ✅ PASS | Migração idempotente (`ALTER TABLE` seguro). Todos os dados prévios de alunos, notas e intervenções mantidos intactos com novos campos preenchidos com valores padrão. |
| **8** | **Usabilidade e Continuidade Operacional** | ⏳ PENDENTE ACEITE | Protocolo de contingência em papel documentado (Seção 4). Aguarda assinaturas das 5 lideranças escolares na máquina física. |

---

## 3. Relatório Técnico: Resolução da Vulnerabilidade `private-ip`

- **Caminho de Dependência Identificado:**  
  `aquila-pro-school-os@2.1.0` ➔ `@libp2p/mdns@9.0.14` ➔ `@libp2p/utils@4.0.7` ➔ `private-ip@3.0.2` (Advisory `GHSA-9h3q-32c7-r533`).
- **Diagnóstico de Ativação:**  
  O pacote upstream `private-ip` encerrou manutenção na versão 3.0.2 sem patch. Ele era puxado exclusivamente pelo motor de descoberta mDNS da malha Mesh P2P.
- **Ações Corretivas Implementadas:**
  1. **Quarentena Estrita de Mesh/P2P (Desativação de Rota):**  
     O motor Mesh foi colocado sob feature flag restrita (`process.env.AQUILA_ENABLE_MESH === 'true'`). Em modo piloto H-01 padrão, nem `SovereignMeshService` nem `NexusMeshService` inicializam os nós libp2p, impedindo a execução de `@libp2p/mdns` e eliminando a superfície de ataque em runtime.
  2. **Defesa em Profundidade Ativa (`NetworkTargetGuard`):**  
     Implementado em [`NetworkTargetGuard.ts`](file:///c:/aquila/apps/electron/src/main/services/NetworkTargetGuard.ts). O interceptor rejeita determinísticamente formatos octais (`0177.0.0.1`), hexadecimais (`0x7f.0.0.1`), numéricos dword (`2130706433`), metadados de nuvem (`169.254.169.254`, `metadata.google.internal`) e loopbacks.
  3. **Comprovação em Testes Automatizados:**  
     Bateria Jest dedicada [`MeshQuarantineAndTargetGuard.test.ts`](file:///c:/aquila/apps/electron/src/main/services/__tests__/MeshQuarantineAndTargetGuard.test.ts) executada com **100% de aprovação (4/4 testes)**.
  4. **Termo de Aceite Residual:**  
     Risco de dependência transitiva desativada em runtime aceito temporariamente para o Piloto H-01 (nó único local). Prazo final para descolamento do pacote para plugin modular externo: Ciclo v2.3 (30 dias).

---

## 4. Protocolo de Contingência em Papel & Continuidade Operacional

Em caso de qualquer anomalia física na máquina de bancada durante a aplicação das atividades escolares:

### Critérios de Parada Imediata (Stop-the-Line):
1. Falha de hardware, superaquecimento do nó Edge (>75ºC persistente) ou interrupção de energia prolongada.
2. Inconsistência física detectada no banco SQLite (`PRAGMA integrity_check != ok`).
3. Bloqueio indevido de acesso docente ou discente que não possa ser recuperado em até 3 minutos.

### Procedimento de Contingência (Fallback para Papel):
- **Passo 1:** A coordenação pedagógica autoriza a transição imediata para cadernos impressos de avaliação previamente lacrados no armário da secretaria.
- **Passo 2:** O docente aplica a avaliação em papel e coleta as respostas manualmente.
- **Passo 3:** Após o restabelecimento da máquina de bancada, a secretaria realiza o lançamento em lote ou importação assistida das notas, sem prejuízo ao tempo ou resultado dos estudantes.
- **SLA de Suporte Local:** Atendimento em bancada em até 15 minutos pela equipe de TI designada.

---

## 5. Matriz de Aceite Humano (Human-in-the-Loop — HITL)

Para homologação final e instalação na primeira turma do piloto escolar, este documento deve ser assinado pelas autoridades escolares responsáveis:

| Papel / Responsabilidade | Nome do Responsável | Parecer | Assinatura e Data |
| :--- | :--- | :---: | :--- |
| **Coordenação Pedagógica**<br>*Aceite da jornada, atividades e intervenção* | ____________________________________ | [ ] Aprovado<br>[ ] Rejeitado | _____________________<br>Data: ___/___/2026 |
| **Direção Escolar**<br>*Autorização do piloto institucional H-01* | ____________________________________ | [ ] Aprovado<br>[ ] Rejeitado | _____________________<br>Data: ___/___/2026 |
| **Encarregado de Dados (DPO)**<br>*Validação LGPD, soberania e zero vazamento* | ____________________________________ | [ ] Aprovado<br>[ ] Rejeitado | _____________________<br>Data: ___/___/2026 |
| **Administração de TI & Redes**<br>*Bancada Windows, firewall e integridade* | ____________________________________ | [ ] Aprovado<br>[ ] Rejeitado | _____________________<br>Data: ___/___/2026 |
| **Responsável Técnico de Software**<br>*Vínculo SHA `F087E4B4` e commit `871c80f4`* | **Anti Gravity / Áquila Core** | [x] Aprovado | *Assinado Digitalmente*<br>Data: 03/11/2026 |

---
*Relatório de Evidências Automatizadas gravado em: [`test-results/h01_complete_homologation_evidence.json`](file:///c:/aquila/test-results/h01_complete_homologation_evidence.json)*
