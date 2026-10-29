# 🚀 Áquila Pro — Guia de Implantação e Operação no Colégio Piloto
### Manual de Desdobramento Rápido (Cold Start), Governança de Portas e Resiliência
#### Versão 2.1.0-rc.3 | Outubro de 2026 | Documento Soberano

---

## 🏛️ 1. Visão Geral da Arquitetura de Borda (Edge First)

O **Áquila Pro** foi concebido para operar em ambiente escolar com **autonomia operacional total** (Sovereign Edge Computing). Todas as operações críticas — reconhecimento facial nas catracas, chamadas em tempo real em sala de aula, controle financeiro PIX e sincronizações com sistemas contábeis — ocorrem localmente no hardware da escola, mesmo na ausência de conexão com a Internet externa.

```
                      ┌──────────────────────────────────────────────┐
                      │            REDE LOCAL DA ESCOLA              │
                      │             (192.168.18.0/24)                │
                      └──────────────────────┬───────────────────────┘
                                             │
               ┌─────────────────────────────┼─────────────────────────────┐
               │                             │                             │
      ┌────────▼────────┐           ┌────────▼────────┐           ┌────────▼────────┐
      │ Câmeras Portaria│           │ Câmeras Salas   │           │ Servidor Áquila │
      │   RTSP H.264    │           │  de Aula RTSP   │           │   (Edge Box)    │
      │ 192.168.18.50+  │           │ 192.168.18.60+  │           │  192.168.18.91  │
      └─────────────────┘           └─────────────────┘           └────────┬────────┘
                                                                           │
                         ┌─────────────────────────────────────────────────┤
                         │ Porta 9000: Gateway Central WebSocket & REST    │
                         │ Porta 8081: Metro Bundler / Mobile Companion    │
                         │ Porta 8000: Worker NPU/GPU Visão Computacional  │
                         │ Porta 3000: Portais Web Multi-Perfil (Next.js) │
                         │ Porta 3001: Renderer Electron (Vite Local Dev)  │
                         └─────────────────────────┬───────────────────────┘
                                                   │
                                   ┌───────────────┴───────────────┐
                                   │                               │
                          ┌────────▼────────┐             ┌────────▼────────┐
                          │   Portais Web   │             │ Mobile Companion│
                          │ Aluno, Prof, Pai│             │ App Android/iOS │
                          │  e Coordenação  │             │   Portaria/Pai  │
                          └─────────────────┘             └─────────────────┘
```

---

## 💻 2. Requisitos de Hardware & Modos de Aceleração

O ecossistema suporta múltiplos perfis de aceleração de IA conforme a infraestrutura disponível:

| Recurso | Mínimo Homologado (Até 500 alunos) | Recomendado (500 a 2.500 alunos) |
| :--- | :--- | :--- |
| **Processador (CPU)** | Intel Core i5 11ª Gen / AMD Ryzen 5 (6 núcleos) | Intel Core i7 13ª Gen / AMD Ryzen 7 (8+ núcleos) |
| **Aceleração IA** | Fallback CPU AVX-512 / OpenVINO CPU | **NPU Dedicada (26+ TOPS)** ou GPU NVIDIA RTX 3060 (12GB) |
| **Memória RAM** | 16 GB DDR4 3200 MHz | 32 GB DDR5 4800 MHz |
| **Armazenamento** | 512 GB SSD NVMe M.2 (Leitura > 2.000 MB/s) | 1 TB SSD NVMe M.2 Gen4 (Leitura > 5.000 MB/s) |
| **Rede** | 1x Porta Gigabit Ethernet RJ-45 | 2x Portas Gigabit Ethernet (Redundância / VLAN de Câmeras) |
| **Alimentação** | No-break Senoidal 1200 VA (Autonomia $\ge 30\text{ min}$) | No-break Senoidal 2000 VA On-line Dupla Conversão |
| **Sistema Operacional**| Windows 10/11 Pro 64-bit (Build 22H2+) | Windows 11 Pro Enterprise 64-bit |

---

## 🌐 3. Mapeamento de Portas & Regras de Firewall

### A. Tabela Oficial de Portas

| Porta | Protocolo | Direção | Serviço / Aplicação | Finalidade |
| :---: | :---: | :---: | :--- | :--- |
| **9000** | TCP / WS | Inbound | `apps/electron` (Gateway) | Barramento central WebSocket & REST, telemetria e sincronização |
| **8081** | TCP / HTTP | Inbound | `apps/mobile` (Metro) | Servidor do app Mobile Companion para smartphones na LAN |
| **8000** | TCP / HTTP | Inbound | `packages/vision-worker` | Worker de IA para inferência facial (OpenVINO / InsightFace) |
| **3000** | TCP / HTTP | Inbound | `apps/web` (Next.js) | Portais web da secretaria, professores, alunos e responsáveis |
| **3001** | TCP / HTTP | Localhost | `apps/electron` (Vite) | Servidor Vite interno do processo Renderer do Electron |
| **554** | TCP / RTSP | Outbound | Conexão com Câmeras IP | Recepção contínua dos feeds de vídeo RTSP (H.264) |

### B. Liberação no Firewall do Windows (Executar no PowerShell como Administrador)

```powershell
New-NetFirewallRule -DisplayName "Aquila Pro - Gateway Core (9000)" -Direction Inbound -LocalPort 9000 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Aquila Pro - Mobile Metro (8081)" -Direction Inbound -LocalPort 8081 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Aquila Pro - Vision Worker (8000)" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Aquila Pro - Web Portals (3000)" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

---

## ⚡ 4. Roteiro de Inicialização (Cold Start)

### Passo 1: Instalação de Dependências e Build Inicial

No diretório raiz `C:\aquila`:

```powershell
# 1. Instalar dependências de todos os workspaces do monorepo
pnpm install

# 2. Executar compilação do Electron e Web
pnpm --filter aquila-pro-school-os run build:electron
pnpm --filter @aquila/web run build
```

### Passo 2: Inicialização dos Serviços em Modo Produção

Execute os serviços em janelas de terminal dedicadas (ou configure via Windows Task Scheduler):

```powershell
# Terminal 1 — Gateway & Desktop School OS (Electron Nativo)
cd C:\aquila
pnpm --filter aquila-pro-school-os run start

# Terminal 2 — Mobile Companion Hub (Expo/Metro na LAN)
cd C:\aquila
pnpm --filter aquila-pro-mobile run start --lan

# Terminal 3 — Portais Web Multi-Perfil (Next.js)
cd C:\aquila
pnpm --filter @aquila/web run start
```

---

## 🗄️ 5. Governança de Dados, Criptografia & Rotina de Backup

### A. Localização dos Bancos de Dados
* **Banco Principal:** `C:\Users\[USUARIO]\AppData\Roaming\AquilaPro\aquila.db`
* **Arquivos Auxiliares WAL:** `aquila.db-wal` e `aquila.db-shm`

### B. Script de Backup a Quente (Hot Backup sem Interrupção)
Como o banco utiliza SQLite com Write-Ahead Logging (`PRAGMA journal_mode = WAL`), o backup pode ser executado enquanto a portaria continua registrando passagens:

```powershell
# C:\aquila\scripts\backup-aquila.ps1
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupDir = "D:\Aquila_Backups\$Timestamp"
New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null

$SourceDb = "$env:APPDATA\AquilaPro\aquila.db"
$TargetDb = "$BackupDir\aquila.db"

# Backup seguro utilizando utilitário SQLite ou cópia atômica com lock transitório
sqlite3 $SourceDb ".backup '$TargetDb'"

Write-Host "[BACKUP] ✅ Backup concluído em: $TargetDb"
```

### C. Proteção LGPD (Art. 14 e 16)
* Os embeddings biométricos faciais (vetores 512-D) são salvos com cifragem local DPAPI (Data Protection API) ou AES-256-GCM.
* Nenhum dado biométrico cru de menores de idade transita por servidores externos em nuvem pública sem anonimização quântica e consentimento explícito assinado pelos responsáveis legais.

---

## ✅ 6. Checklist de Validação Final da Implantação & Protocolo Físico (48h)

Antes de declarar o Colégio Piloto pronto para o primeiro dia de operação oficial, a equipe técnica deve cumprir as fases do protocolo escalonado em consonância com o **Dossiê de Comissionamento Técnico de Bancada** (`docs/DOSSIE_COMISSIONAMENTO_BANCADA_PILOTO_V1.md`) e a **Entrevista Mestra** (`docs/ENTREVISTA_MESTRA_IA_DESENVOLVEDORA_AQUILA_PRO_COMPLETA_AQ001_AQ400.md`):

### Fase T-48h: Infraestrutura de Rede, Elétrica & Segurança Física
- [ ] **Alimentação Ininterrupta:** No-break senoidal de 1200 VA (ou 2000 VA) instalado, com teste de autonomia em carga real ($\ge 30\text{ min}$).
- [ ] **Endereçamento IP Estático:** Servidor Edge configurado no IP estático corporativo da escola (`192.168.18.91/24`).
- [ ] **Segmentação de Câmeras (VLAN):** Feeds de vídeo RTSP das câmeras de portaria e salas de aula isolados em VLAN dedicada sem acesso direto à Internet externa.

### Fase T-24h: Provisionamento do Servidor & Liberação de Portas
- [ ] **Firewall Local:** Regras de Firewall do Windows executadas para liberação das portas `9000` (Gateway), `8081` (Metro), `8000` (Visão NPU) e `3000` (Portais Web).
- [ ] **Certificação dos 8 Pilares:** Execução do script `python scripts/hardware_bench_commissioning.py` com resultado de 8/8 PASS registrado no relatório JSON.
- [ ] **Suíte de Testes Monorepo:** Verificação de 100% de sucesso nos 311 testes unitários (`npm test`).
- [ ] **Espaço em Disco & Armazenamento:** Mínimo de 100 GB livres no SSD NVMe principal e partição de backup secundária montada.

### Fase T-1h: Pré-Operação Matutina (Cold Start Checklist)
- [ ] **Healthcheck Gateway:** Requisição `GET http://localhost:9000/health` retornando `{"status":"HEALTHY"}` com latência $<15\text{ ms}$.
- [ ] **Aceleração de IA Facial:** O worker de visão detecta rostos em $<150\text{ ms}$ (NPU/GPU) ou $<400\text{ ms}$ (CPU fallback).
- [ ] **Latência RTSP:** Câmeras da portaria operando com latência de vídeo inferior a $300\text{ ms}$ e sem perda de pacotes UDP/TCP.
- [ ] **App Mobile Companion:** Pareamento de tablets da portaria e coordenação via QR Code concluído com sucesso.
- [ ] **Persistência SQLite:** Teste de inserção e consulta com integridade `PRAGMA quick_check;` aprovada em modo WAL.

### Fase T+1h: Acolhimento e Operação em Horário de Pico
- [ ] **Reconhecimento Facial em Fluxo:** Monitoramento visual das passagens de alunos na portaria (limiar de cosseno $S \ge 0.68$).
- [ ] **Notificações em Tempo Real:** Disparo imediato de confirmação de entrada aos responsáveis pelo aplicativo móvel.
- [ ] **Monitoramento Térmico:** Temperatura da CPU/NPU operando em faixa segura ($< 70^\circ\text{C}$), sem acionamento de auto-throttling.

### Fase T+30d: Conclusão do Ciclo de Homologação Assistida
- [ ] **Auditoria Zero-Bypass:** Exportação da trilha de auditoria SHA-256 para o DPO escolar, atestando conformidade com o Art. 14 da LGPD.
- [ ] **Calibração Psicométrica TRI:** Validação de aderência dos itens simulados às escalas oficiais do SAEB e ENEM.
- [ ] **Assinatura do Termo de Rollout Definitivo:** Emissão do relatório final conjunto entre a diretoria do colégio e o Córtex Central Áquila Pro.
