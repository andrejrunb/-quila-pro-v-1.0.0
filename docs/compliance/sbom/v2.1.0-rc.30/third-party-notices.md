# 📜 Third-Party Notices & Open Source Attribution
**Áquila Pro School OS** — Release Candidate `v2.1.0-rc.30` / `v2.1.0-rc.32`  
**Baseline Git Commit:** `59b2233af8a6370853b298750014d885ca09ee65`  
**Gerenciador Oficial e Único:** `pnpm` (`pnpm-lock.yaml`)  
**Data da Emissão:** 30 de Outubro de 2026  

---

## ⚖️ 1. Licença do Produto & Esclarecimento da Transição para BSL 1.1

O Áquila Pro é licenciado sob a **Business Source License 1.1 (BSL 1.1)**, formalizada no commit [`dcb41574`](https://github.com/andrejrunb/-quila-pro-v-1.0.0/commit/dcb41574) da branch ativa `clean-release-v1`.

- **Histórico da Branch `main` (MIT Inicial):** O repositório na branch legada utilizou boilerplate MIT durante as fases preliminares de concepção (versões pré-rc.25).
- **Finalidade da BSL 1.1:** Proteger a soberania dos dados de menores (LGPD Art. 14) contra apropriação por nuvens públicas comerciais multitenant e conferir *Additional Use Grants* para auditorias educacionais e pilotos autorizados (H-01 e H-02).
- **Change Date:** Conversão automática e perpétua para **Apache 2.0** fixada para **01/01/2030**.

---

## 🟢 2. Componentes de Runtime em Produção (Electron / Web)

Total de componentes de produção: **74**. Todos classificados na categoria **VERDE (Permitida)**:

| Dependência | Versão | Licença | Categoria | Workspace |
| :--- | :---: | :---: | :---: | :--- |
| **@aquila/api** | `workspace:*` | `SEE LICENSE IN LICENSE` | `DESCONHECIDA` | `apps/electron` |
| **@chainsafe/libp2p-noise** | `15.0.0` | `Apache-2.0 OR MIT` | `VERDE` | `apps/electron` |
| **@google/generative-ai** | `0.24.1` | `Apache-2.0` | `VERDE` | `apps/electron` |
| **@libp2p/mdns** | `9.0.0` | `Apache-2.0 OR MIT` | `VERDE` | `apps/electron` |
| **@libp2p/mplex** | `10.0.0` | `Apache-2.0 OR MIT` | `VERDE` | `apps/electron` |
| **@libp2p/tcp** | `9.0.0` | `Apache-2.0 OR MIT` | `VERDE` | `apps/electron` |
| **@modelcontextprotocol/sdk** | `1.29.0` | `MIT` | `VERDE` | `apps/electron` |
| **@react-three/drei** | `9.122.0` | `MIT` | `VERDE` | `apps/electron` |
| **@react-three/fiber** | `8.18.0` | `MIT` | `VERDE` | `apps/electron` |
| **@supabase/supabase-js** | `2.39.4` | `MIT` | `VERDE` | `apps/electron` |
| **@types/better-sqlite3** | `7.6.13` | `MIT` | `VERDE` | `apps/electron` |
| **@types/three** | `0.184.0` | `MIT` | `VERDE` | `apps/electron` |
| **animejs** | `4.3.0-beta.2` | `MIT` | `VERDE` | `apps/electron` |
| **axios** | `1.7.0` | `MIT` | `VERDE` | `apps/electron` |
| **bcryptjs** | `3.0.3` | `BSD-3-Clause` | `VERDE` | `apps/electron` |
| **better-sqlite3** | `11.5.0` | `MIT` | `VERDE` | `apps/electron` |
| **crypto-js** | `4.2.0` | `MIT` | `VERDE` | `apps/electron` |
| **date-fns** | `4.1.0` | `MIT` | `VERDE` | `apps/electron` |
| **dotenv** | `16.4.0` | `BSD-2-Clause` | `VERDE` | `apps/electron` |
| **drizzle-kit** | `0.31.11` | `Apache-2.0` | `VERDE` | `apps/electron` |
| **drizzle-orm** | `0.45.3` | `Apache-2.0` | `VERDE` | `apps/electron` |
| **electron-log** | `5.1.0` | `MIT` | `VERDE` | `apps/electron` |
| **electron-store** | `8.2.0` | `MIT` | `VERDE` | `apps/electron` |
| **electron-updater** | `6.8.3` | `MIT` | `VERDE` | `apps/electron` |
| **exceljs** | `3.4.0` | `MIT` | `VERDE` | `apps/electron` |
| **google-auth-library** | `11.1.0` | `Apache-2.0` | `VERDE` | `apps/electron` |
| **googleapis** | `183.0.0` | `Apache-2.0` | `VERDE` | `apps/electron` |
| **graphology** | `0.26.0` | `MIT` | `VERDE` | `apps/electron` |
| **graphology-communities-louvain** | `2.0.2` | `MIT` | `VERDE` | `apps/electron` |
| **graphology-types** | `0.24.8` | `MIT` | `VERDE` | `apps/electron` |
| **inversify** | `6.2.2` | `MIT` | `VERDE` | `apps/electron` |
| **it-length-prefixed** | `9.0.0` | `Apache-2.0 OR MIT` | `VERDE` | `apps/electron` |
| **it-pipe** | `3.0.0` | `Apache-2.0 OR MIT` | `VERDE` | `apps/electron` |
| **konva** | `10.2.3` | `MIT` | `VERDE` | `apps/electron` |
| **libp2p** | `3.3.11` | `Apache-2.0 OR MIT` | `VERDE` | `apps/electron` |
| **lucide-react** | `1.7.0` | `ISC` | `VERDE` | `apps/electron` |
| **minisearch** | `7.2.0` | `MIT` | `VERDE` | `apps/electron` |
| **next** | `16.3.8` | `MIT` | `VERDE` | `apps/electron` |
| **node-schedule** | `2.1.1` | `MIT` | `VERDE` | `apps/electron` |
| **nodemailer** | `10.0.13` | `MIT-0` | `VERDE` | `apps/electron` |
| **pdf-lib** | `1.17.1` | `MIT` | `VERDE` | `apps/electron` |
| **qrcode-terminal** | `0.12.0` | `MIT` | `VERDE` | `apps/electron` |
| **qrcode.react** | `4.2.0` | `ISC` | `VERDE` | `apps/electron` |
| **react-is** | `19.2.5` | `MIT` | `VERDE` | `apps/electron` |
| **react-konva** | `18.2.10` | `MIT` | `VERDE` | `apps/electron` |
| **recharts** | `3.8.0` | `MIT` | `VERDE` | `apps/electron` |
| **reflect-metadata** | `0.2.2` | `Apache-2.0` | `VERDE` | `apps/electron` |
| **sharp** | `0.35.5` | `Apache-2.0` | `VERDE` | `apps/electron` |
| **three** | `0.184.0` | `MIT` | `VERDE` | `apps/electron` |
| **uint8arrays** | `5.0.0` | `Apache-2.0 OR MIT` | `VERDE` | `apps/electron` |
| **use-image** | `1.1.4` | `MIT` | `VERDE` | `apps/electron` |
| **uuid** | `9.0.0` | `MIT` | `VERDE` | `apps/electron` |
| **ws** | `8.16.0` | `MIT` | `VERDE` | `apps/electron` |
| **zod** | `4.3.6` | `MIT` | `VERDE` | `apps/electron` |
| **archiver** | `7.0.1` | `MIT` | `VERDE` | `apps/electron` |
| **apexcharts** | `5.10.6` | `SEE LICENSE IN LICENSE` | `DESCONHECIDA` | `apps/web` |
| **clsx** | `2.1.1` | `MIT` | `VERDE` | `apps/web` |
| **react** | `19.2.4` | `MIT` | `VERDE` | `apps/web` |
| **react-apexcharts** | `2.1.0` | `SEE LICENSE IN LICENSE` | `DESCONHECIDA` | `apps/web` |
| **react-dom** | `19.2.4` | `MIT` | `VERDE` | `apps/web` |
| **tailwind-merge** | `3.5.0` | `MIT` | `VERDE` | `apps/web` |
| **@expo/metro-runtime** | `3.2.3` | `MIT` | `VERDE` | `apps/mobile` |
| **expo** | `51.0.0` | `MIT` | `VERDE` | `apps/mobile` |
| **expo-constants** | `16.0.2` | `MIT` | `VERDE` | `apps/mobile` |
| **expo-linking** | `6.3.1` | `MIT` | `VERDE` | `apps/mobile` |
| **expo-router** | `3.5.15` | `MIT` | `VERDE` | `apps/mobile` |
| **expo-status-bar** | `1.12.1` | `MIT` | `VERDE` | `apps/mobile` |
| **lucide-react-native** | `0.395.0` | `ISC` | `VERDE` | `apps/mobile` |
| **react-native** | `0.74.2` | `MIT` | `VERDE` | `apps/mobile` |
| **react-native-safe-area-context** | `4.10.1` | `MIT` | `VERDE` | `apps/mobile` |
| **react-native-screens** | `3.31.1` | `MIT` | `VERDE` | `apps/mobile` |
| **react-native-web** | `0.19.10` | `MIT` | `VERDE` | `apps/mobile` |
| **@trpc/server** | `10.45.0` | `MIT` | `VERDE` | `packages/api` |
| **@aquila/db** | `workspace:*` | `SEE LICENSE IN LICENSE` | `DESCONHECIDA` | `packages/api` |

---

## 🐍 3. Componentes Python (Edge Workers & OMR)

Total de componentes Python: **11**. Todos classificados na categoria **VERDE (Permitida)**:

| Pacote | Versão | Licença | Finalidade |
| :--- | :---: | :---: | :--- |
| **numpy** | `1.26.4` | `BSD-3-Clause` | Transformações matriciais e vetoriais de embeddings 512-D |
| **opencv-python-headless** | `4.9.0.80` | `Apache-2.0` | Visão computacional, segmentação e homografia OMR local |
| **pillow** | `10.3.0` | `HPND` | Manipulação gráfica de imagens e gabaritos |
| **requests** | `2.31.0` | `Apache-2.0` | Comunicação HTTP segura com GPU Colab / NVIDIA REST |
| **urllib3** | `2.2.1` | `MIT` | Pool de conexões TLS 1.3 |
| **pydantic** | `2.7.1` | `MIT` | Validação e serialização estrita de dados pedagógicos |
| **cryptography** | `42.0.7` | `Apache-2.0` | Criptografia em repouso AES-256-GCM |
| **psutil** | `5.9.8` | `BSD-3-Clause` | Monitoramento térmico e auto-throttling de hardware Edge |
| **fastapi** | `0.111.0` | `MIT` | Microserviço local de visão |
| **uvicorn** | `0.29.0` | `BSD-3-Clause` | Servidor ASGI assíncrono para o microserviço |
| **cyclonedx-bom** | `4.4.0` | `Apache-2.0` | Geração de manifestos SBOM de conformidade |

---

## 🛡️ 4. Política de Licenciamento & Auditoria Anti-GPL

- **Licenças Proibidas em Produção (GPL / AGPL / SSPL):** **ZERO (0)** dependências proibidas vinculadas estaticamente ao binário de distribuição `Aquila Pro.exe`.
- **Khan Academy Perseus:** Licença MIT upstream. Execução 100% offline-first.
- **H5P Player Engine:** Player e bibliotecas de componentes sob MIT/BSD. Isolamento em sandbox.
- **Lockfile Exclusivo:** `package-lock.json` foi formalmente expurgado do repositório para assegurar a reprodutibilidade determinística do `pnpm-lock.yaml`.

---
*Assinado: Córtex de Governança de Software & Conformidade Regulatória Áquila Pro*
