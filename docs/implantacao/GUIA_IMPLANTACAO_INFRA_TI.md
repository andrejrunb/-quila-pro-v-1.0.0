# 🛠️ ÁQUILA PRO — GUIA DE IMPLANTAÇÃO & INFRAESTRUTURA DE TI
### Manual Técnico de Instalação, Topologia de Rede e Configuração de Borda (Edge)
#### Versão 2.4 — Colégio Piloto & Redes de Ensino

---

## 🏛️ 1. Arquitetura da Solução & Topologia Local

O **Áquila Pro** adota o paradigma **Sovereign Edge Computing (Computação Soberana em Borda)**. Todo o processamento de imagens, reconhecimento facial e inteligência relacional ocorre no servidor físico instalado no colégio, sem dependência contínua de internet para as operações vitais de portaria e chamada em sala de aula.

```
                     ┌──────────────────────────────────────────────┐
                     │            REDE LOCAL DA ESCOLA              │
                     │             (192.168.18.0/24)                │
                     └──────────────────────┬───────────────────────┘
                                            │
               ┌────────────────────────────┼────────────────────────────┐
               │                            │                            │
      ┌────────▼────────┐          ┌────────▼────────┐          ┌────────▼────────┐
      │ Câmeras Portaria│          │ Câmeras Salas   │          │ Servidor Áquila │
      │   RTSP H.264    │          │  de Aula RTSP   │          │   (Edge Box)    │
      │ 192.168.18.50+  │          │ 192.168.18.60+  │          │  192.168.18.91  │
      └─────────────────┘          └─────────────────┘          └────────┬────────┘
                                                                         │
                        ┌────────────────────────────────────────────────┤
                        │ Porta 9000: Gateway WebSocket & REST          │
                        │ Porta 8081: Metro Server / App Companion       │
                        │ Porta 8000: Worker NPU/GPU Visão Computacional│
                        └────────────────────────┬───────────────────────┘
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

## 💻 2. Especificação Mínima & Recomendada do Servidor Edge

| Componente | Especificação Mínima (Até 500 alunos) | Especificação Recomendada (500 a 2.500 alunos) |
| :--- | :--- | :--- |
| **Processador (CPU)** | Intel Core i5 11ª Gen / AMD Ryzen 5 (6 núcleos) | Intel Core i7 13ª Gen / AMD Ryzen 7 (8+ núcleos) |
| **Aceleração IA (NPU/GPU)**| Suporte OpenVINO / CPU AVX2 | **NPU Dedicada (26+ TOPS)** ou NVIDIA RTX 3060 (12GB) |
| **Memória RAM** | 16 GB DDR4 3200MHz | 32 GB DDR5 4800MHz |
| **Armazenamento** | 512 GB SSD NVMe M.2 (Leitura > 2.000 MB/s) | 1 TB SSD NVMe M.2 Gen4 (Leitura > 5.000 MB/s) |
| **Interface de Rede** | 1x Porta Gigabit Ethernet RJ-45 (10/100/1000) | 2x Portas Gigabit Ethernet (Redundância / VLAN Câmeras) |
| **Alimentação Elétrica** | No-break Senoidal 1200 VA (Autonomia $\ge 30\text{ min}$) | No-break Senoidal 2000 VA On-line Dupla Conversão |
| **Sistema Operacional** | Windows 10/11 Pro 64-bit (Build 22H2+) | Windows 11 Pro Enterprise 64-bit |

---

## 📹 3. Requisitos & Posicionamento das Câmeras IP (RTSP)

### A. Especificação Técnica Recomendada
* **Resolução:** Full HD 1080p (1920 × 1080 pixels);
* **Taxa de Quadros:** 25 a 30 FPS constantes;
* **Protocolo de Saída:** RTSP (`rtsp://usuario:senha@ip:554/stream1`);
* **Codec:** H.264 Baseline ou Main Profile (não utilizar H.265 em navegadores puros);
* **Sensor & Iluminação:** WDR Dinâmico $\ge 120\text{ dB}$ (essencial contra reflexos e sol direto na portaria);
* **Lente:** 2.8 mm (abertura ampla de 105° para portaria) ou 4 mm (foco estreito para salas).

### B. Geometria de Instalação na Portaria / Catracas
* **Altura de Fixação:** Entre $1,40\text{ m}$ e $1,60\text{ m}$ do piso acabado (ângulo ideal para capturar crianças de 1,20m e adultos de 1,90m);
* **Ângulo de Inclinação (Pitch):** $15^\circ$ a $20^\circ$ descendente;
* **Distância Focal Efetiva:** $1,5\text{ m}$ a $3,5\text{ m}$ da linha de passagem da catraca;
* **Iluminação Complementar:** Spot LED de luz neutra (4000K) indireta de 15W acima da passagem para eliminar sombras faciais severas à noite.

---

## 🌐 4. Configuração de Rede, Roteamento & Portas

### A. Tabela de Portas do Servidor Áquila Pro
| Porta | Protocolo | Direção | Finalidade |
| :---: | :---: | :---: | :--- |
| **9000** | TCP / WebSocket | Inbound | Barramento Central Áquila Gateway (Telemetria, BI e Sincronização) |
| **8081** | TCP / HTTP | Inbound | Servidor Metro Bundler para o App Mobile Companion dos Pais e Portaria |
| **8000** | TCP / HTTP | Inbound | Worker NPU/GPU de Visão Computacional e Inferência HNSW |
| **554** | TCP / RTSP | Outbound | Conexão de captura contínua com as Câmeras IP da escola |

### B. Regras de Firewall do Windows (PowerShell Administrador)
Execute o comando abaixo no servidor da escola para liberar as portas necessárias:
```powershell
New-NetFirewallRule -DisplayName "Aquila Pro Gateway" -Direction Inbound -LocalPort 9000 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Aquila Pro Mobile Metro" -Direction Inbound -LocalPort 8081 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Aquila Pro Vision Worker" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow
```

---

## 🗄️ 5. Hot-Folder & Integrações de Sistemas (SigaWeb & Domínio)

### A. Integração Domínio Sistemas (Thomson Reuters)
* **Diretório Padrão de Exportação:** `C:\aquila\storage\dominio_out`
* **Arquivos Gerados Automaticamente:**
  * `DOMINIO_LANC_CONTABEIS_YYYYMMDD_xxxxxx.txt`: Lote de partidas dobradas contábeis (`|6000|`).
  * `DOMINIO_BAIXAS_RECEBER_YYYYMMDD_xxxxxx.txt`: Lote de liquidações bancárias de PIX (`|5100|`).
* **Rotina Contábil:** O software da contabilidade deve apontar a rotina "Importação de Lançamentos" diretamente para a pasta compartilhada `C:\aquila\storage\dominio_out`.

### B. Integração SigaWeb (Diários de Classe & LDB)
* **Horário Automatizado de Execução:** Diariamente às **18:30** via Cron do `RpaOrchestrator`.
* **Idempotência Garantida:** Cada sincronização computa um hash SHA-256 exclusivo da turma e data. Se o diário já foi homologado sem alterações, o envio duplicado é automaticamente bloqueado, evitando erros de duplicidade no SigaWeb.

---

## 🛡️ 6. Rotina de Backup e Recuperação de Desastres (DRP)

1. **Localização do Banco de Dados:**  
   `C:\Users\[USUARIO]\AppData\Roaming\AquilaPro\aquila.db`
2. **Procedimento de Backup Diário Automatizado:**  
   O SQLite opera em modo WAL (`Write-Ahead Logging`). Para realizar backup a quente sem parar a portaria:
   ```powershell
   # Script de Backup Seguro
   $BackupDir = "D:\Aquila_Backups\" + (Get-Date -Format "yyyyMMdd_HHmm")
   New-Item -ItemType Directory -Force -Path $BackupDir
   Copy-Item "C:\Users\Thaysa\AppData\Roaming\AquilaPro\aquila.db*" $BackupDir -Force
   ```
3. **Chave DPAPI de Criptografia:**  
   A chave de proteção local dos dados biométricos é atrelada à credencial do sistema operacional da máquina servidora. Realizar snapshot do estado do Windows mensalmente.

---

## 📞 7. Suporte Técnico & Checklist de Validação Final
Antes de liberar a portaria para operação real com alunos:
- [ ] Pingar todas as câmeras IP na faixa `192.168.18.x` com latência $<3\text{ ms}$;
- [ ] Acessar `http://192.168.18.91:9000/health` e validar resposta `{"status":"HEALTHY"}`;
- [ ] Conectar o App Mobile via QR Code na rede Wi-Fi interna da escola;
- [ ] Realizar teste de passagem com 3 alunos cadastrados e verificar notificação no Portal dos Pais em $<2\text{ segundos}$.
