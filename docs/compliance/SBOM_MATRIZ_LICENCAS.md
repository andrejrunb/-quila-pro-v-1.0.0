# 📜 Software Bill of Materials (SBOM) & Matriz de Procedência de Código

**Áquila Pro — Versão v2.1.0-rc.6**  
**Data:** 25 de Outubro de 2026  
**Finalidade:** Transparência de propriedade intelectual, compatibilidade de licenças de código aberto e auditoria de conformidade.

---

## 🧭 1. Princípios de Governança de Terceiros e Licenciamento

1. **Separação entre Pesquisa de Borda e Código de Produção:** Componentes experimentais e estudos de engenharia reversa residem estritamente em `external/` ou `docs/research/`, isolados do núcleo escolar homologado.
2. **Compatibilidade Permissiva:** Dependências de produção são estritamente regidas por licenças permissivas (MIT, Apache-2.0, BSD-2/3-Clause, ISC).
3. **Respeito aos Termos de Plataformas Externas:** Nenhuma automação de terceiros deve ser apresentada como substituta de contratações formais ou convênios educacionais.

---

## 📊 2. Matriz de Componentes Externos Analisados

| Componente / Repositório | Licença Original | Origem / Mantenedor | Tipo de Interação no Áquila Pro | Status de Maturidade | Risco de IP / Termos de Uso | Medida de Mitigação |
| :--- | :---: | :--- | :--- | :---: | :---: | :--- |
| **`ruvnet/RuView`** | MIT | ruvnet | Submódulo em `external/RuView`. Ingestão de telemetria via UDP 5005 no `WiFiDensePoseService`. | **Experimental (Labs)** | Baixo (Licença MIT). Alto se aplicado em áreas íntimas sem RIPD. | Monitoramento de áreas íntimas bloqueado por padrão; autenticação HMAC e validação em laboratório. |
| **`api-anything`** | MIT | api-anything | Submódulo em `external/api-anything`. Estudo de arquitetura multi-tier para resiliência de rede. | **Pesquisa / Arquitetura** | Baixo (MIT). Médio se usado para scraping não autorizado. | Restrito a integração de sistemas escolares sob contrato ou com dados públicos/abertos. |
| **`ruvnet/claude-flow` (ruflo)** | MIT | ruvnet | Submódulo em `external/ruflo`. Referência para topologia em malha e consenso entre agentes locais. | **Pesquisa / Arquitetura** | Baixo (MIT). | Orquestração interna rodando em SQLite local sem envio de dados a servidores do mantenedor. |
| **`oraios/serena`** | MIT | oraios | Submódulo em `external/serena`. Ferramentas de navegação semântica em AST via LSP. | **Ferramenta de Dev** | Baixo (MIT). | Utilizado exclusivamente no ambiente de desenvolvimento do time de engenharia. |
| **`EvolutionAPI` / `Baileys`** | MIT | Evolution / adiwajshing | Provedor secundário no `NotificationGateway.ts`. Protocolo WhatsApp Web emulado. | **Experimental (Opt-in)** | **Alto** (Risco de bloqueio de número por termos do WhatsApp/Meta). | WhatsApp Meta Cloud API oficial definida como canal primário; Evolution como contingência opt-in. |
| **`xtool-org/xtool`** | Apache-2.0 | xtool-org | Wrapper em script PowerShell (`scripts/build_ios_xtool.ps1`) para automação de build. | **Experimental (DevOps)** | Baixo (Apache-2.0). | Identificado expressamente como script auxiliar dependente da presença do binário local. |
| **`RecursiveSI/flint`** | MIT | RecursiveSI | Referência de SLM de borda para inferência via `scripts/local_model_runner.py`. | **Pesquisa / Labs** | Baixo (MIT). | Inferência 100% on-device em hardware edge. |
| **`Brisk Teaching` & `Plurall`** | Proprietário | Brisk / SOMOS | Estudo comparativo de funcionalidades pedagógicas (DOK Bloom, OMR, micro-learning). | **Pesquisa de Mercado** | **Alto** se houver cópia de código ou desobfuscação indevida. | **Zero código de terceiros absorvido**. Apenas implementação própria (*clean-room*) das rotinas de OMR e diagramação A4. |
| **`SigaWeb` / `Domínio Sistemas`** | Proprietário | Órgãos Públicos / Thomson Reuters | Conectores de sincronização de diários e conciliação escolar. | **Contrato / Piloto** | Médio. | Sincronização condicionada a convênio escolar formal e permissão institucional expressa. |

---

## 🛡️ 3. Declaração de Licença do Monorepo

O Áquila Pro é distribuído sob os termos da **Licença MIT** (conforme arquivo `LICENSE` na raiz).
Todas as contribuições e módulos derivados respeitam as obrigações de atribuição e direitos autorais dos respectivos mantenedores originais.
