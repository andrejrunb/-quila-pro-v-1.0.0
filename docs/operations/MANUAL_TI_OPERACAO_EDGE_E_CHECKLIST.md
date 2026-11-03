# 🛠️ Manual de Operação e Checklist do Servidor Edge — Áquila Pro v2.1

> **Destinatários:** Equipe de Tecnologia da Informação (TI), Administradores de Rede e Direção Pedagógica  
> **Versão Homologada de Software:** `v2.1.0-rc.15`  
> **Classificação:** Documento Oficial de Operação e Homologação Pré-Go-Live

---

## 🏗️ 1. Requisitos de Infraestrutura Local e Perímetro

### A. Hardware do Servidor Edge Escolar
| Componente | Especificação Mínima Homologada | Função Operacional |
| :--- | :--- | :--- |
| **Processador (CPU)** | Intel Core i5 (10ª+ Geração) ou AMD Ryzen 5 | Execução do núcleo SQLite WAL e processamento OMR. |
| **Memória RAM** | 16 GB DDR4 | Cache de banco e processos paralelos de visão/serviço. |
| **Armazenamento** | 256 GB SSD NVMe M.2 (Leitura $\ge 2.000\text{ MB/s}$) | Banco de dados `aquila.db` e snapshots locais. |
| **Alimentação Elétrica** | Nobreak Senoidal 1.200 VA (Autonomia $\ge 30\text{ min}$) | Proteção contra desligamentos abruptos e transientes. |
| **Mídia Externa (Backup)** | Unidade USB 3.0 de 64 GB+ formatada com BitLocker | Cópia secundária da política 3-2-1 (`D:\AquilaBackups`). |

### B. Segmentação de Rede e Firewall Local (Zero Inbound WAN)
O servidor **nunca deve ter portas expostas para a Internet pública**. Todo tráfego deve ser restrito à LAN local:
- **IP Estático do Servidor:** `192.168.10.50` (ou IP fixo configurado na VLAN administrativa).
- **Porta TCP 3000 (Portal Web Next.js):** Liberada apenas para IPs da sub-rede da escola (`192.168.10.0/24`).
- **Porta TCP 9000 (WebSocket TLS 1.3):** Liberada exclusivamente para catracas e terminais de chamada.
- **Portas WAN Inbound:** **100% Bloqueadas**. O servidor faz apenas conexões saintes (*egress*) via HTTPS (porta 443) para a API oficial do WhatsApp Meta Cloud.

```powershell
# Script de Configuração Rápida do Firewall (Executar no PowerShell como Administrador):
Set-NetFirewallProfile -Profile Domain,Public,Private -DefaultInboundAction Block
New-NetFirewallRule -DisplayName "AquilaPro Web LAN" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow -RemoteAddress "192.168.10.0/24"
New-NetFirewallRule -DisplayName "AquilaPro WebSocket Core" -Direction Inbound -LocalPort 9000 -Protocol TCP -Action Allow -RemoteAddress "192.168.10.0/24"
```

---

## 🚀 2. Instalação e Configuração Passo a Passo

### Passo 1: Preparação do Ambiente no Windows Server / Windows 11 Pro
1. Instalar o Node.js v20+ LTS oficial.
2. Instalar o Git for Windows.
3. Clonar ou descompactar a release oficial homologada:
   ```bash
   git clone -b clean-release-v1 https://github.com/andrejrunb/-quila-pro-v-1.0.0.git C:\aquila
   cd C:\aquila
   pnpm install --frozen-lockfile
   ```

### Passo 2: Configuração Segura da Chave Mestra de Backup (DPAPI / Vault)
Gere uma chave forte de 32 bytes (base64) e configure na conta de serviço do sistema operacional:
```powershell
# Gerar chave criptográfica de alta entropia (44 caracteres):
$MasterKey = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

# Injetar de forma persistente nas variáveis do sistema do servidor Edge:
[Environment]::SetEnvironmentVariable("AQUILA_AUTH_SECRET", [System.Convert]::ToHexString([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32)), "Machine")
[Environment]::SetEnvironmentVariable("AQUILA_BACKUP_MASTER_KEY", $MasterKey, "Machine")
[Environment]::SetEnvironmentVariable("AQUILA_SECONDARY_BACKUP_DIR", "D:\AquilaBackups", "Machine")
```
> [!CAUTION]
> Guarde uma cópia dessa chave no cofre físico de senhas da instituição. Sem essa chave, os backups cifrados com AES-256-GCM são matematicamente irrecuperáveis.

### Passo 3: Agendamento da Rotina Diária de Backup (Task Scheduler)
Execute no PowerShell do servidor para registrar o job que roda diariamente às 23:00 fora do processo principal:
```powershell
$Action = New-ScheduledTaskAction -Execute "node" -Argument "C:\aquila\scripts\backup_edge.cjs --dest C:\AquilaPro\backups --dest-secondary D:\AquilaBackups --require-secondary true"
$Trigger = New-ScheduledTaskTrigger -Daily -At 23:00
$Principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
Register-ScheduledTask -TaskName "AquilaPro_Edge_DailyBackup" -Action $Action -Trigger $Trigger -Principal $Principal -Description "Rotina Oficial de Backup AES-256-GCM e Rotação GFS do Áquila Pro"
```

---

## 🩺 3. Painel de Diagnóstico e Verificação de Saúde (Healthcheck)

`pnpm test:dr:full` é uma suíte automatizada de desenvolvimento/teste, não um healthcheck operacional validado para uma instalação escolar. Não a execute apontando para dados instalados ou reais. Use somente monitoramento operacional aprovado e somente leitura; não há neste checklist um comando integrado de healthcheck validado.

**Protocolo de Recuperação e Restauração Segura:**
- O protocolo transacional de restauração em 7 etapas com journal atômico e recuperação no boot (`recoverPendingRestoreOnBoot`) foi implementado e validado em ambiente de testes unitários (Commit `3af691d2`, 10/10 cenários Jest PASS).
- Para execução de homologação em bancada física antes do go-live em campo, utilize estritamente o roteiro de corte físico de energia documentado em: [`PROTOCOLO_TESTE_BANCADA_E_CORTE_ENERGIA_H01.md`](file:///c:/aquila/docs/operations/PROTOCOLO_TESTE_BANCADA_E_CORTE_ENERGIA_H01.md).
- Em ambiente de produção real com dados escolares, a substituição manual de banco de dados (`restore`) permanece restrita e exige autorização conjunta do DPO e do Administrador de TI.

---

## ⚡ 4. Procedimento de Reinício Seguro e Contingência Offline

### A. Queda de Conexão com a Internet (WAN)
- O Áquila Pro continua **100% operacional offline**: chamadas de presença, correções de provas OMR e boletins continuam sendo processados localmente no SQLite.
- As notificações destinadas aos pais são acumuladas com segurança na tabela `notification_outbox`.
- Assim que o link com a internet é restabelecido, o serviço drena a fila respeitando o *rate limit* da Meta.

### B. Procedimento de Reinício Seguro do Servidor Edge
Caso seja necessário reiniciar a máquina física:
1. Solicite a parada graciosa pelo gerenciador de serviços aprovado para essa instalação. Antes de qualquer ação manual, confirme o serviço e o PID exatos da instância Áquila Pro. Não encerre processos globalmente por nome (`electron` ou `node`).
2. Se o host precisar reiniciar, siga o procedimento de mudança aprovado do sistema operacional.
3. Após o boot, inicie pelo mesmo gerenciador aprovado e confirme o healthcheck e a abertura do banco pelos procedimentos somente leitura autorizados.
4. O replay do WAL depende do estado do SQLite e não é uma garantia de recuperação. Em caso de lock, erro de integridade ou estado inesperado, preserve `aquila.db`, `aquila.db-wal` e `aquila.db-shm`, interrompa novas gravações pelo procedimento aprovado e escale para a Engenharia. Não remova esses arquivos nem execute restore/reset.

---

## 🔍 5. Como Identificar e Resolver Falhas Operacionais

| Sintoma Observado | Causa Provável | Procedimento de Resolução pela TI |
| :--- | :--- | :--- |
| **Folha OMR marcada como "PENDING_TEACHER_REVIEW"** | Aluno rasurou ou fez preenchimento duplo ($\Delta\text{fill} < 25\%$). | Não é falha de sistema; é comportamento de proteção. O professor visualiza o recorte e homologa com 1 clique no portal. |
| **Notificações de presença não chegam no WhatsApp dos pais** | Falta de Internet local ou token da Meta Cloud API expirado. | 1. Verificar conectividade do servidor edge.<br>2. Validar token institucional no painel Meta Business Manager. |
| **Erro "AQUILA_BACKUP_MASTER_KEY é obrigatória" no log** | A variável de ambiente não foi configurada na conta de serviço. | Configurar a variável no Windows via `[Environment]::SetEnvironmentVariable` e reiniciar o terminal. |
| **Lentidão ao abrir chamadas em salas de aula** | Conflito de IP na rede ou saturação do Wi-Fi dos professores. | Verificar tráfego da rede local; confirmar que a latência no servidor permanece $< 5\text{ ms}$. |

---

## 📞 6. Matriz de Escalonamento e Abertura de Chamados

Caso ocorra um incidente de severidade alta:

| Nível de Suporte | Responsável | Escopo de Atuação |
| :--- | :--- | :--- |
| **Nível 1 (Local)** | Suporte de TI do Colégio | Hardware físico, cabos de rede, nobreak, scanner e reinício do servidor. |
| **Nível 2 (DPO / Coordenação)** | Direção Escolar / DPO | Homologação de novos professores, consentimentos LGPD e auditoria de exclusões. |
| **Nível 3 (Engenharia Central)** | Suporte Áquila Pro | Erros de integridade de banco, falhas de compilação ou patches de software. |

### Modelo de Coleta de Logs para Suporte Nível 3:
Ao acionar a engenharia, envie o relatório gerado por:
```powershell
# Extrair resumo de versão e saúde para envio ao suporte:
node -e "console.log('Versao:', 'v2.1.0-rc.15', 'Commit:', require('child_process').execSync('git rev-parse HEAD').toString().trim())"
```

---

## 📋 7. Checklist Formal de Homologação Pré-Go-Live

Preencha e assine antes de liberar o sistema para o primeiro dia letivo com estudantes reais:

### Verificações de Infraestrutura Física:
- [ ] **Nobreak:** Testado puxando o plugue da tomada sob carga; bateria sustentou o servidor por $> 30$ minutos.
- [ ] **Mídia Secundária:** Unidade USB conectada na porta traseira do servidor e acessível em `D:\AquilaBackups`.
- [ ] **Temperatura:** Servidor operando em ambiente ventilado com temperatura da CPU $< 60^\circ\text{C}$.

### Verificações de Rede e Segurança:
- [ ] **IP Fixo:** Servidor configurado com IP estático na rede cabeada Gigabit.
- [ ] **Firewall:** Portas 3000 e 9000 liberadas apenas para a faixa interna de computadores da escola.
- [ ] **Bloqueio WAN:** Servidor inacessível a partir de conexões externas diretas.
- [ ] **Chave Mestra:** `AQUILA_BACKUP_MASTER_KEY` gerada com $\ge 32$ caracteres e guardada em cofre físico.

### Verificações de Continuidade e Testes:
- [ ] **Backup Testado:** Executado `pnpm backup:edge` com sucesso comprovado nos dois destinos.
- [ ] **Restore/DR (BLOQUEADO):** não executar drill ou restauração. Manter este gate pendente até protocolo seguro, testes de falha/recuperação em ambiente isolado e aprovação operacional documentados.
- [ ] **Stress Test:** Executado `node scripts/stress_test_pilot_realistic.cjs` aprovado com 500 alunos e latência p95 $< 150\text{ ms}$.
- [ ] **WhatsApp Testado:** Mensagem de teste da Meta Cloud API recebida com sucesso no celular da direção.

---

### Termo de Homologação Operacional

Este termo só pode ser assinado quando todos os gates aplicáveis desta checklist estiverem aprovados e houver aprovação operacional própria. Enquanto o gate de restore/DR estiver bloqueado, este documento não autoriza go-live nem operação com dados reais de estudantes.

**Local e Data:** _________________________, _____ de __________________ de 2026.

____________________________________________________  
**Responsável de TI da Escola** (Nome / Assinatura)

____________________________________________________  
**Diretor(a) Pedagógico(a) da Escola** (Nome / Assinatura)
