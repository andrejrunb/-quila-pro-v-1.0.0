# 🧠 Arquitetura Dual-Core

O Áquila Pro utiliza uma arquitetura híbrida projetada para escalar globalmente enquanto mantém o controle absoluto no local físico da escola.

## 1. Cloud SaaS (A Nuvem Central)
A camada de gestão administrativa e externa, acessível via portais web.
- **Portais**: Pais, Alunos, RH e BI Consolidado.
- **Tecnologias**: Next.js, tRPC, Drizzle ORM, PostgreSQL (Neon Edge).
- **Responsabilidade**: Faturamento, pagamentos (PIX), relatórios de alto nível e gateway de mensageria externa.

## 2. Antigravity Kernel (O Núcleo Soberano)
O motor local que executa no **Áquila Edge Hub**.
- **Motor**: Electron (TypeScript) + C++.
- **IA Vision**: Python Workers para processamento de biometria facial e RTSP.
- **Banco de Dados**: SQLite (WAL Mode) para persistência local ultrarrápida.
- **Micro-serviços Locais**: Whatsapp Local, Controle de Câmeras, Sensores de Pânico.

## 🔄 Mecanismo de Sincronização
A comunicação entre o Kernel e o Cloud ocorre por meio de **Telemetria Sintetizada**. Dados brutos de imagem e vídeo nunca saem da escola; apenas metadados de eventos e resumos financeiros são sincronizados para a nuvem.

## 🏗️ Orquestração de Inteligência (Córtex)
O **Córtex Logic** atua como o sistema nervoso central dentro do Electron, roteando tarefas para agentes especializados via **MCP (Model Context Protocol)** e mantendo o **Sovereign Knowledge Graph (SKG)**.

---
*Fonte: [ARCHITECTURE_OVERVIEW.md](../sources/ARCHITECTURE_OVERVIEW.md) e [BRAIN_ORIENTATION.md](../sources/BRAIN_ORIENTATION.md)*
