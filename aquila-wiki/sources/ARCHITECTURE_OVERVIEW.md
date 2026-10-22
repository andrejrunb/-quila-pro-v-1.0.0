# 🧠 Arquitetura Core (Dual Architecture)

O Áquila não é mais um monólito engessado. Para suportar escala planetária e computação agressiva em escolas sem internet fidedigna (Brasil profundo), nós faturamos o projeto em dois universos:

## 1. Cloud Web (A Nuvem Central)
Gerido unicamente neste repositório (`c:\aquila`), a **Plataforma Áquila** lida com transações financeiras, relatórios consolidados em BI e portais de pais/RH.
**Tecnologia:**
- Next.js (Frontend e SSG/SSR)
- tRPC (Comunicação Backend End-to-End Type safe)
- Drizzle ORM + PostgreSQL (Neon Edge)
- Redis para mensageria / Rate Limiting

## 2. Antigravity Kernel (O Desktop Escolar offline-first)
Hospedado externamente no diretório / repositório **Antigravity** (`c:\aquila_antigravity`).
O Kernel é o nosso software proprietário (Electron + C++) que vai para dentro das secretarias das escolas e trabalha mesmo sob ausência total de Wi-Fi e fibra óptica.

Ele comanda:
- **Biometria Face ID Paralela (FaceWorker CPU/NPU)**: Trabalha cruzando embeddings nativamente via SQLite.
- **Micro-Expressões / LGPD Tracker**: Detecções invasivas ocorrem **apenas** no Node e morrem de madrugada dentro da RAM (Sem subir rostos pra AWS!).
- **Redundância Híbrida**: Enfileiramento de boletos, mensagens HTTP do Whatsapp Local.
- **RTSP Network Vision**: Scanners diretos dos switches D-LINK internos da escola (Latência em milisegundos ignorando APIs da nuvem).

### ⚙️ Orquestração de Deploy
Quando um cliente escola fecha contrato, o sistema injeta um binário MSI/EXE auto-hospedável nas docas do colégio. A partir deste ponto, o Edge se comunica com a nossa Nuvem Cloud apenas para subir telemetria financeira ou comportamental sintetizada, **nunca** transferindo fluxo MP4 bruto das câmeras.

> *Esta é a blindagem e a arma secreta do nosso crescimento frente as gigantes EdTechs de banco de dados arcaicos.*
