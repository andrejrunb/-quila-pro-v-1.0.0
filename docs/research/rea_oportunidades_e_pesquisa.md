# 🔬 Dossiê de Pesquisa e Oportunidades Técnicas (REA) — Áquila Pro

> **Classificação:** Documento Técnico de Pesquisa & Prototipagem (Labs)  
> **Versão de Referência:** `v2.1.0-rc.6` (Branch `clean-release-v1` / `main`, Commit `7e0556c8`)  
> **Aviso Legal:** As tecnologias analisadas neste documento representam estudos de viabilidade arquitetural, protótipos de engenharia reversa para interoperabilidade e benchmarks. Nenhuma funcionalidade de alto risco é promovida para o ambiente escolar de produção sem homologação jurídica, [RIPD/DPIA institucional](../compliance/RIPD_DPIA_Biometria_Menores.md) e validação técnica independente.

---

## 🧭 1. Finalidade do Estudo de Engenharia Reversa (REA)

Ao longo do desenvolvimento do Áquila Pro, múltiplos componentes de código aberto, ferramentas de Model Context Protocol (MCP) e plataformas legadas foram explorados para identificar:
1. Padrões de arquitetura resiliente (*Offline-First* e *Local Edge*).
2. Protocolos de interoperabilidade escolar com diários e sistemas legados.
3. Técnicas de visão e sinais físicos que preservem a privacidade de estudantes.

O objetivo **não é incorporar código de terceiros de forma indiscriminada**, mas realizar análises *clean-room* e prototipagens isoladas que fundamentem as decisões da equipe de engenharia.

---

## 📊 2. Matriz de Maturidade dos Componentes Analisados

| Componente / Repositório | Domínio de Pesquisa | Status de Maturidade | Nível de Integração no Código | Risco & Salvaguardas |
| :--- | :--- | :---: | :--- | :--- |
| **`ruvnet/RuView`** | Percepção passiva de presença via perturbações de RF/CSI (WiFi 802.11) | **Protótipo de Laboratório** | Ingestão UDP em [`WiFiDensePoseService.ts`](file:///c:/aquila/apps/electron/src/main/services/WiFiDensePoseService.ts) com autenticação HMAC e allowlist de IPs. | **Alto Risco em Áreas Íntimas:** Monitoramento de banheiros e vestiários **estritamente bloqueado por padrão**. Simulações sintéticas impedidas de disparar alertas de emergência. |
| **`api-anything`** | Síntese de rotas REST a partir de tráfego HTTP (*Multi-Tier Ladder*) | **Estudo Arquitetural** | Submódulo em `external/api-anything`. Conceitos aplicados na resiliência do [`SigaWebWorker.ts`](file:///c:/aquila/apps/electron/src/main/services/rpa/SigaWebWorker.ts). | **Médio:** Automação de portais condicionada a convênios e autorizações institucionais expressas. |
| **`ruvnet/claude-flow` (ruflo)** | Orquestração de agentes autônomos em malha hierárquica | **Estudo Arquitetural** | Submódulo em `external/ruflo`. Padrão de fila de mensagens aplicado em [`SwarmManager.ts`](file:///c:/aquila/apps/electron/src/main/services/agents/SwarmManager.ts). | **Baixo:** Agentes operam 100% localmente com armazenamento em SQLite. |
| **`oraios/serena`** | Ferramentas semânticas de edição e navegação em AST via LSP | **Ferramenta de Dev** | Submódulo em `external/serena`. Apoio interno a refatorações do time de desenvolvimento. | **Mínimo:** Não empacotado no executável do cliente final. |
| **`EvolutionAPI` / `Baileys`** | Emulação do protocolo WebSocket do WhatsApp Web | **Experimental (Opt-in)** | Provedor de contingência em [`NotificationGateway.ts`](file:///c:/aquila/apps/electron/src/main/services/NotificationGateway.ts). | **Alto Risco Operacional:** Risco de suspensão de número pelo WhatsApp. O canal primário homologado é o **WhatsApp Meta Cloud API oficial**. |
| **`xtool-org/xtool`** | Toolchain SwiftPM para compilação cruzada de iOS no Windows/Linux | **Script Experimental** | Script de automação em [`scripts/build_ios_xtool.ps1`](file:///c:/aquila/scripts/build_ios_xtool.ps1). | **Parcial:** Requer dependências nativas e não substitui a assinatura de código Apple em produção. |
| **`RecursiveSI/flint`** | SLM de borda com quantização GGUF para inferência local | **Protótipo de Pesquisa** | Script de teste em [`scripts/local_model_runner.py`](file:///c:/aquila/scripts/local_model_runner.py). | **Baixo:** Inferência offline em CPU/NPU sem dependência de nuvem externa. |
| **`Brisk Teaching` & `Plurall`** | Plataformas educacionais proprietárias | **Engenharia Reversa Reversa / Análise Funcional** | **Zero código absorvido**. Apenas implementação própria (*clean-room*) das rotinas de OMR e diagramação A4. | **Alto se violado IP:** Nenhuma extensão ou código de terceiros empacotado no produto. |

---

## 🔒 3. Separação Estrita: Piloto de Produção vs. Laboratório

Conforme estabelecido no [Congelamento de Escopo do Piloto](../../apps/electron/src/config/pilotScope.ts):
- **Homologado para Uso Escolar (Core):** Diário digital, chamada assistida por conferência humana, mensageria oficial aos pais, notas/boletins e leitura controlada de cartões OMR.
- **Isolado em Laboratório (Labs):** Qualquer inferência passiva por radiofrequência, agentes autônomos de captação e canais de mensageria não oficiais permanecem desativados por padrão e marcados como experimentais.

Consulte a procedência e termos de licenciamento no [SBOM & Matriz de Licenças](../compliance/SBOM_MATRIZ_LICENCAS.md).
