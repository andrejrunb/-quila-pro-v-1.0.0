# Áquila Pro — Ata de Homologação Presencial do Piloto H-01
## Comissão de Aceite Operacional & Governança Soberana

---

### Termo de Abertura & Identificação Institucional

Aos `_____` dias do mês de `_______________` de `2026`, na cidade de `____________________/___`, nas dependências da instituição escolar abaixo qualificada, reuniu-se a **Comissão de Homologação Presencial** para realização dos ensaios de conformidade, integridade de dados, segurança RBAC, contenção de interface e recuperação de desastre (DR) da versão candidata do software **Áquila Pro**, com vistas à liberação controlada do **Piloto H-01 (1 turma letiva de até 30 estudantes)**.

---

## 1. Identificação do Ambiente Físico & Estação Edge

| Campo | Especificação Homologada / Registrada no Local |
| :--- | :--- |
| **Instituição Escolar:** | `__________________________________________________________________` |
| **Endereço / Unidade:** | `__________________________________________________________________` |
| **Local da Instalação:** | Sala de Servidores / Secretaria Acadêmica (Ambiente de Acesso Restrito) |
| **Identificação da Máquina (Hostname):** | `__________________________________________________________________` |
| **Fabricante & Modelo do Hardware:** | `__________________________________________________________________` |
| **Processador (CPU) & Memória RAM:** | `________________________________________` \| RAM: `______ GB` |
| **Armazenamento Primário:** | SSD NVMe / SATA: `______ GB Livres` |
| **Sistema Operacional:** | Windows 10 Pro / Windows 11 Pro 64-bit (Build: `_________________`) |
| **Software Antivírus / EDR Ativo:** | `__________________________________________________________________` |
| **Status da Exclusão de Varredura no AppData:** | `[ ] Configurada para %APPDATA%\AquilaPro` \| `[ ] Não requerida` |
| **Tipo de Conta de Execução no Windows:** | `[ ] Usuário Padrão Local (Recomendado)` \| `[ ] Administrador Local` |
| **Conectividade Externa (Offline-First):** | `[ ] Isolado / Rede Local` \| `AQUILA_ENABLE_CLOUD_CONNECTORS=false` |

---

## 2. Identidade Criptográfica do Candidato & Rastreabilidade de Commits

A integridade do software submetido a esta avaliação é garantida pela **Tríade de Rastreabilidade** de commits auditados no repositório oficial:

```text
source_commit:        0612be71f307399e2bc8d31fe1dc71e9a7e37e9d (Código, binários e app.asar)
evidence_commit:      050b3ce92bf18b3874134be1086a2e411f16da0a (Relatórios JSON de bancada)
documentation_commit: a87c7f0f366675e019c95e8b253261279e34191c (Dossiê v2.1.1 e manifestos)
bench_suite_commit:   ecec85b2983d448ac5e5a21f54a723421613206f (Instalador NSIS e suite 20/20)
```

### 2.1. Verificação Prévia de Hashes SHA-256 dos Binários de Distribuição

Antes da instalação ou execução, a equipe de TI deve executar no terminal PowerShell local:
```powershell
Get-FileHash -Algorithm SHA256 "AquilaPro-Setup-2.1.0.exe"
```

| Componente | Caminho de Origem / Instalação | SHA-256 Oficial Esperado (Manifesto) | SHA-256 Calculado no Local | Conferência TI |
| :--- | :--- | :--- | :--- | :---: |
| **Instalador NSIS Oficial** | `AquilaPro-Setup-2.1.0.exe` | `CADCAE5A339ED2BBAAC324F878E6C3CE01884F92FA82DB91D339787C1867D84D` | `________________________________________________________________` | `[ ] OK` |
| **Executável Principal** | `%LOCALAPPDATA%\Programs\AquilaPro\Aquila Pro.exe` | `F087E4B45834D8DAECBF88DD61B0A2757AB836B8A1891C16CA0AAB321E5D7EBB` | `________________________________________________________________` | `[ ] OK` |
| **Pacote ASAR da Aplicação** | `...\resources\app.asar` | `0166AD40F37BF0CAC8B9862CB477D074875DA5E7B8B14128B30204E1DCE806FF` | `________________________________________________________________` | `[ ] OK` |
| **Módulo Nativo SQLite** | `...\better_sqlite3.node` | `AD19705C7938A60EF5557E31D152843CC42364684913847FBD623484430283A3` | `________________________________________________________________` | `[ ] OK` |
| **Motor Autônomo DR v2.1.2** | `...\restore_edge.ps1` | `097EE957A62FD9AE7F75FD0842C445131BC3858D1405C0214AE24E9BF96BACBE` | `________________________________________________________________` | `[ ] OK` |
| **Lançador Transacional DR** | `...\restore_edge.bat` | `13E5622F291B75EBDF4BDA4B8926BE4A85BBDC12CAC3EA219B773964ACA6E4D1` | `________________________________________________________________` | `[ ] OK` |

---

## 3. Checklist de Execução dos 20 Casos de Homologação em Campo

A comissão deve testemunhar a execução dos 20 casos de validação essencial utilizando os perfis sintéticos de aceitação criados na base local de teste da escola.

| ID | Domínio / Caso de Teste | Procedimento de Verificação | Critério de Aceite Esperado | Bancada | Resultado Presencial | Rubrica TI/DPO |
| :---: | :--- | :--- | :--- | :---: | :---: | :---: |
| **TC-01** | Autenticação RBAC: `admin` | Login com usuário e senha scrypt de administrador | Token emitido; sessão autenticada; acesso total | 🟢 PASS | `[ ] Aprovado  [ ] Reprovado` | `__________` |
| **TC-02** | Autenticação RBAC: Coordenação | Login com perfil `coord_pilot` | Token emitido; redirecionamento pedagógico correto | 🟢 PASS | `[ ] Aprovado  [ ] Reprovado` | `__________` |
| **TC-03** | Autenticação RBAC: Docente | Login com perfil `prof_pilot` | Token emitido; acesso restrito às turmas do professor | 🟢 PASS | `[ ] Aprovado  [ ] Reprovado` | `__________` |
| **TC-04** | Autenticação RBAC: Secretaria | Login com perfil `secr_pilot` | Token emitido; módulo de matrículas/alunos liberado | 🟢 PASS | `[ ] Aprovado  [ ] Reprovado` | `__________` |
| **TC-05** | Autenticação RBAC: Família | Login com perfil `pais_pilot` | Token emitido; confinamento imediato ao Portal Pais | 🟢 PASS | `[ ] Aprovado  [ ] Reprovado` | `__________` |
| **TC-06** | Autenticação RBAC: Estudante | Login com perfil `aluno_pilot` | Token emitido; portal do aluno sem controles admin | 🟢 PASS | `[ ] Aprovado  [ ] Reprovado` | `__________` |
| **TC-07** | Barreira IPC Negativa: Docente | `prof_pilot` tenta disparar `createStudent()` via IPC | IPC rejeita com erro `UNAUTHORIZED` | 🟢 PASS | `[ ] Aprovado  [ ] Reprovado` | `__________` |
| **TC-08** | Barreira IPC Negativa: Família | `pais_pilot` tenta disparar `createStudent()` via IPC | IPC rejeita com erro `UNAUTHORIZED` | 🟢 PASS | `[ ] Aprovado  [ ] Reprovado` | `__________` |
| **TC-09** | Barreira IPC Negativa: Estudante | `aluno_pilot` tenta disparar `createStudent()` via IPC | IPC rejeita com erro `UNAUTHORIZED` | 🟢 PASS | `[ ] Aprovado  [ ] Reprovado` | `__________` |
| **TC-10** | Barreira IPC Negativa: Anônimo | Chamada IPC sem sessão ativa | IPC rejeita com erro `UNAUTHORIZED` | 🟢 PASS | `[ ] Aprovado  [ ] Reprovado` | `__________` |
| **TC-11** | Barreira IPC Positiva: Secretaria | `secr_pilot` executa cadastro de aluno via IPC | Sucesso (`success: true`); ID gerado no SQLite | 🟢 PASS | `[ ] Aprovado  [ ] Reprovado` | `__________` |
| **TC-12** | Contenção de Rota UI (Família) | `pais_pilot` tenta forçar navegação para `/finance` | Router intercepta e restringe ao `ParentPortal` | 🟢 PASS | `[ ] Aprovado  [ ] Reprovado` | `__________` |
| **TC-13** | Isolamento Parental (Positivo) | `pais_pilot` consulta dados de `std-pilot-999` (tutela) | Dados acadêmicos e frequência exibidos | 🟢 PASS | `[ ] Aprovado  [ ] Reprovado` | `__________` |
| **TC-14** | Isolamento Parental (Negativo) | `pais_pilot` tenta consultar aluno terceiro (`std-45453`) | Acesso bloqueado; ausência de guarda legal | 🟢 PASS | `[ ] Aprovado  [ ] Reprovado` | `__________` |
| **TC-15** | Chamada Escolar em Lote | Professor lança frequência para 25 alunos da turma | Persistência atômica concluída em $< 2.000\text{ ms}$ | 🟢 PASS (39ms) | `[ ] Aprovado  [ ] Reprovado` | `__________` |
| **TC-16** | Diário de Classe: Notas | Lançamento de nota diagnóstica (`9.8`) pelo docente | Registro gravado com sucesso em `student_grades` | 🟢 PASS | `[ ] Aprovado  [ ] Reprovado` | `__________` |
| **TC-17** | Desempenho e Latência IPC | 100 requisições consecutivas de IPC na estação | $p_{50} \le 50\text{ ms}$ e $p_{95} \le 200\text{ ms}$ sem engasgos | 🟢 PASS (4ms) | `[ ] Aprovado  [ ] Reprovado` | `__________` |
| **TC-18** | Acessibilidade Teclado & Foco | Navegação por `Tab` e inspeção de acessibilidade básica | Ordem de foco linear; campos de entrada rotulados | 🟢 PASS | `[ ] Aprovado  [ ] Reprovado` | `__________` |
| **TC-19** | Persistência a Frio (Reboot) | Encerramento do Electron e reabertura limpa | 100% dos registros persistidos intactos no SQLite | 🟢 PASS | `[ ] Aprovado  [ ] Reprovado` | `__________` |
| **TC-20** | Disaster Recovery Estrito | Execução de `restore_edge.ps1` **sem** flags de exceção | 0 violações de FK; integridade `ok`; banco ativo | 🟢 PASS | `[ ] Aprovado  [ ] Reprovado` | `__________` |

---

## 4. Ensaios Presenciais Especiais de Resiliência & Segurança

### 4.1. Prova do Ensaio Disaster Recovery Estrito (Sem `-AllowFkViolations`)
1. **Procedimento:**
   - Com o aplicativo encerrado, disparar manualmente o utilitário DR:
     ```powershell
     powershell -ExecutionPolicy Bypass -File "%LOCALAPPDATA%\Programs\AquilaPro\restore_edge.ps1"
     ```
2. **Evidências Coletadas no Local:**
   - Hash SHA-256 do Banco Ativo Restaurado: `________________________________________________________________`
   - Diretório do Snapshot de Rollback Seguro: `________________________________________________________________`
   - Resultado do `PRAGMA integrity_check`: `[ ] ok` \| `[ ] erro: _______________________________`
   - Resultado do `PRAGMA foreign_key_check`: `[ ] 0 violações (vazio)` \| `[ ] violações: ________`
   - Conclusão do Procedimento: `[ ] RESTAURACAO DISASTER RECOVERY CONCLUIDA COM SUCESSO`

### 4.2. Prova do Bloqueio de Inicialização por Concorrência (`restore.lock`)
1. **Procedimento:**
   - Criar manualmente o arquivo de trava:
     ```powershell
     New-Item -ItemType File -Path "$env:APPDATA\AquilaPro\restore.lock" -Force
     ```
   - Iniciar o executável `Aquila Pro.exe`.
2. **Evidência Coletada no Local:**
   - O aplicativo exibiu diálogo/erro bloqueando a abertura do banco de dados enquanto o lock existia? `[ ] SIM  [ ] NÃO`
   - Mensagem de erro ou log registrado: `____________________________________________________________`
   - Remover a trava (`Remove-Item "$env:APPDATA\AquilaPro\restore.lock"`).
   - O aplicativo inicializou com normalidade após a remoção da trava? `[ ] SIM  [ ] NÃO`

### 4.3. Prova de Persistência a Frio e Sobrevivência a Queda de Energia Simulada
1. **Procedimento:**
   - Criar 1 registro pedagógico ou de presença.
   - Forçar o encerramento imediato via gerenciador de tarefas:
     ```powershell
     Stop-Process -Name "Aquila Pro" -Force
     ```
   - Reiniciar a máquina ou a aplicação.
2. **Evidência Coletada no Local:**
   - O arquivo WAL foi reconciliado no startup? `[ ] SIM  [ ] NÃO`
   - O registro recém-criado foi recuperado na íntegra sem corrupção? `[ ] SIM  [ ] NÃO`

---

## 5. Delimitação Estrita de Escopo do Piloto H-01

A homologação concedida por este instrumento é regida pelos seguintes limites intransponíveis:

| Dimensão | Limite Máximo Homologado | Ação Proibida no Piloto |
| :--- | :--- | :--- |
| **Turmas Autorizadas:** | **1 única turma piloto** | É vedada a expansão para outras salas sem relatório final do piloto. |
| **Estudantes Ativos:** | **Até 30 estudantes cadastrados** | É vedado o cadastramento de turmas inteiras da escola antes do aceite de H-02. |
| **Duração do Piloto:** | **Máximo de 1 semana letiva (5 dias úteis)** | O piloto deve ser encerrado ou formalmente renovado após o término do período. |
| **Acompanhamento Técnico:** | Presencial / Standby Diário da TI Escolar | Operação sem suporte técnico local não é autorizada. |
| **Nuvem e Telemetria:** | Operação 100% Offline / Edge Local | Nenhum conector de nuvem ou telemetria externa deve ser habilitado. |

---

## 6. Governança de Privacidade & Conformidade LGPD (Art. 14 e 16)

O Encarregado de Proteção de Dados (DPO) atesta as seguintes salvaguardas:

- [ ] **Consentimento Prévio:** Todas as 30 famílias dos estudantes da turma piloto assinaram o Termo de Consentimento Informado para Tratamento de Dados Pessoais de Crianças e Adolescentes.
- [ ] **Soberania do Banco Local:** O banco SQLite `aquila.db` e seus snapshots permanecem confinados na estação física, protegidos contra leitura não autorizada por permissões de ACL do Windows (NTFS) e DPAPI.
- [ ] **Segregação de Mídia e Biometria:** Nenhum dado biométrico cru de alunos é trafegado para fora da máquina local; embeddings faciais (se ativados) são one-way 512-D com hash irrevogável.
- [ ] **Trilha de Auditoria Zero-Bypass:** Eventos sensíveis de cadastro, exclusão e visualização de diário de classe são registrados com hash SHA-256 na tabela `zero_bypass_audits`.
- [ ] **Direito de Revogação e Eliminação:** Rotina de anonimização e descarte programada para acionamento caso qualquer família revogue o consentimento.

---

## 7. Registro de Incidentes, Anomalias ou Ressalvas Operacionais

*(Espaço destinado a anotações de eventuais falhas, lentidões, mensagens inesperadas ou condições específicas observadas durante os testes na máquina da escola)*

```text
____________________________________________________________________________________________________
____________________________________________________________________________________________________
____________________________________________________________________________________________________
____________________________________________________________________________________________________
____________________________________________________________________________________________________
```

---

## 8. Parecer Final da Comissão de Homologação

Após a análise dos artefatos criptográficos, a execução presencial dos 20 casos de teste de aceitação e a realização das provas especiais de DR e startup lock, a Comissão delibera:

- [ ] **HOMOLOGADO SEM RESSALVAS:** O software Áquila Pro v2.1.2 atende integralmente a todos os requisitos de segurança, estabilidade, integridade e privacidade, estando **AUTORIZADO** o início do Piloto H-01 estritamente para a turma designada (`1 turma / até 30 alunos`).
- [ ] **HOMOLOGADO COM RESSALVAS OPERACIONAIS:** O início do piloto é autorizado mediante o cumprimento obrigatório das seguintes condições sanatórias:  
  `__________________________________________________________________________________________________`  
  `__________________________________________________________________________________________________`
- [ ] **NÃO HOMOLOGADO:** Foram identificadas falhas críticas de conformidade ou integridade que impedem a liberação operacional. O software retorna para o ciclo de desenvolvimento e estabilização em bancada.

---

## 9. Assinaturas Formais da Comissão de Aceite

Por estarem de pleno acordo com os termos e resultados registrados nesta ata, firmam o presente documento em 3 (três) vias de igual teor e forma.

<br><br>

____________________________________________________  
**Responsável Técnico de TI & Infraestrutura**  
Nome: `________________________________________________`  
Matrícula / Cargo: `___________________________________`  
Data: `____/____/2026`  

<br><br>

____________________________________________________  
**Diretor(a) Pedagógico(a) / Gestor(a) Escolar**  
Nome: `________________________________________________`  
Matrícula / Cargo: `___________________________________`  
Data: `____/____/2026`  

<br><br>

____________________________________________________  
**Encarregado de Proteção de Dados (DPO / LGPD)**  
Nome: `________________________________________________`  
Registro Profissional / Certificação: `_________________`  
Data: `____/____/2026`  

<br><br>

____________________________________________________  
**Engenheiro(a) de Software / Antigravity Agent**  
Testemunha Técnica de Homologação de Bancada  
Commit de Verificação: `ecec85b2983d448ac5e5a21f54a723421613206f`  
Data: `____/____/2026`  
