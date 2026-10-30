# Licenças de Terceiros e Segregação de Propriedade Intelectual (Áquila Pro)
**Documento de Conformidade Regulatória** • **Versão:** `2.1.0-rc.32`  
**Data da Auditoria:** 30 de Outubro de 2026  
**Baseline Técnica:** Commit `59b2233af8a6370853b298750014d885ca09ee65` / `cf859b57` (Branch: `clean-release-v1`)  
**Licença do Produto Central:** Business Source License 1.1 (BSL 1.1) • Change Date: 01/01/2030 (Apache 2.0)  

---

## ⚖️ 1. Princípios de Governança & Taxonomia Legal de Licenciamento

O Áquila Pro adota uma taxonomia jurídica estrita para classificação de dependências, conteúdos didáticos e modelos de IA, em conformidade com a Lei Federal nº 9.610/98 (Lei de Direitos Autorais) e Lei Federal nº 13.709/2018 (LGPD):

| Categoria | Definição Legal | Tratamento no Áquila Pro |
| :--- | :--- | :--- |
| 🟢 **PERMITIDO (VERDE)** | Licenças de software permissivas (MIT, Apache-2.0, BSD-2/3, ISC, CC0, Public Domain) e conteúdos CC-BY 4.0. | Liberado para compilação, empacotamento no executável nativo e distribuição comercial sob BSL 1.1, com preservação integral dos avisos de direitos autorais. |
| 🟡 **PERMITIDO COM CONDIÇÕES (AMARELA)** | Licenças com restrições operacionais específicas (LGPL-3.0 com vinculação dinâmica, termos de uso comunitário de modelos como Llama 3.1 e Gemma 2). | Permitido mediante cumprimento estrito das condições (atribuição "Built with Llama", vinculação dinâmica de bibliotecas nativas como `libvips` e isolamento de runtime). |
| 🔴 **QUARENTENA / BLOQUEADO (VERMELHA)** | Licenças copyleft virais (GPL-2.0, GPL-3.0, AGPL-3.0), licenças não-comerciais (CC-BY-NC, CC-BY-NC-SA) e obras com direitos autorais reservados (Art. 29 da LDA). | **Expressamente bloqueado** para empacotamento no instalador comercial e proibido para treinamento de modelos de IA. Restrito a ambientes não-comerciais ou consulta bibliográfica de metadados. |

---

## 📦 2. Software Runtime & Bibliotecas de Código Aberto

### 2.1 Matriz de Componentes de Software

| Componente | Versão | Origem / Mantenedor | Licença Upstream | Categoria | Papel no Sistema |
| :--- | :---: | :--- | :---: | :---: | :--- |
| **Electron** | 28.2.0 | Electron / OpenJS Foundation | MIT | 🟢 PERMITIDO | Runtime desktop soberano para Windows 11 com isolamento de contexto. |
| **React & React DOM** | 18.2.0 | Meta Platforms, Inc. | MIT | 🟢 PERMITIDO | Biblioteca de interface do usuário do Cockpit Executivo. |
| **Better-SQLite3** | 9.4.1 | Joshua Wise / WiseLibs | MIT | 🟢 PERMITIDO | Driver síncrono nativo para SQLite local com WAL mode. |
| **SQLite Engine** | 3.45.1 | D. Richard Hipp | Public Domain | 🟢 PERMITIDO | Banco de dados relacional embarcado local imutável. |
| **Vite** | 5.4.21 | Evan You & Vite Contributors | MIT | 🟢 PERMITIDO | Bundler e motor de compilação de produção. |
| **TypeScript** | 5.3.3 | Microsoft Corporation | Apache-2.0 | 🟢 PERMITIDO | Compilador estático e tipagem de contratos de dados. |
| **Lucide Icons** | 0.344.0 | Lucide Project | ISC | 🟢 PERMITIDO | Ícones vetoriais da interface hexagonal. |
| **libp2p Core Stack** | 1.x | Protocol Labs & ChainSafe | Apache-2.0 / MIT | 🟢 PERMITIDO | Malha P2P soberana de sincronização local TLS 1.3. |
| **PDF-Lib** | 1.17.1 | Andrew Dillon | MIT | 🟢 PERMITIDO | Diagramação e emissão de cadernos de prova A4 em duas colunas. |
| **Sharp** | 0.33.x | Lovell Fuller | Apache-2.0 | 🟡 PERMITIDO COM CONDIÇÕES | Processamento e redimensionamento local de imagens. |
| **libvips (via Sharp)** | 8.15.x | libvips Team | LGPL-3.0-or-later | 🟡 PERMITIDO COM CONDIÇÕES | Biblioteca nativa C vinculada dinamicamente via prebuilds oficiais sem contaminação estática do executável principal. |

---

## 🧩 3. Motores Pedagógicos Interativos (Perseus & H5P)

O ecossistema Áquila Pro segrega formalmente os motores de exercícios formativos:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   MOTORES PEDAGÓGICOS FORMATIVOS                       │
├──────────────────────────────────┬─────────────────────────────────────┤
│ 1. KHAN ACADEMY PERSEUS (MIT)    │ 2. H5P CORE & MÓDULOS GPL v3        │
│ • Categoria: 🟢 PERMITIDO        │ • Categoria: 🔴 QUARENTENA / BLOQUEADO│
│ • Sliders paramétricos           │ • Módulos upstream PHP/GPLv3 NÃO    │
│ • Reta numérica interativa       │   são distribuídos no executável.   │
│ • Scaffolding socrático de 3 pts │ • O Áquila utiliza implementação    │
│ • 100% Offline e MIT upstream    │   própria limpa em TypeScript para  │
│                                  │   renderizar JSON de applets.       │
└──────────────────────────────────┴─────────────────────────────────────┘
```

### 3.1 Khan Academy Perseus (MIT)
- **Origem:** `Khan/perseus` (Khan Academy)
- **Licença:** MIT License (Permissiva com atribuição)
- **Status:** 🟢 **PERMITIDO**. Incorporado nativamente em [`H5PPerseusEngine.ts`](file:///c:/aquila/apps/electron/src/services/H5PPerseusEngine.ts) para simulações algébricas e cinemáticas.

### 3.2 H5P Platform Modules (GNU GPL v3)
- **Origem:** Joubel AS / H5P Group
- **Licença:** GNU GPL v3 (Copyleft Viral)
- **Decisão e Governança:** 🔴 **QUARENTENA / ISOLADO**. 
  - Para eliminar riscos de contaminação copyleft sob a licença comercial/BSL 1.1, **nenhum módulo de backend ou pacote GPL v3 do H5P é empacotado no instalador `Aquila Pro.exe`**.
  - O Áquila Pro adota uma arquitetura *clean-room* em TypeScript puro que lê especificações abertas JSON de conteúdo formativo sem carregar bibliotecas upstream sob GPL.

---

## 📚 4. Conteúdo Educacional & Registro de Direitos Autorais

Conforme auditado em [`content-rights-register.json`](file:///c:/aquila/content-rights-register.json), os materiais didáticos são categorizados em dois níveis estritos:

```
                      ACERVO MULTIMODAL PEDAGÓGICO
                                   │
          ┌────────────────────────┴────────────────────────┐
          ▼                                                 ▼
    TIER 1 (PERMITIDO)                             TIER 2 (QUARENTENA)
  Uso no Produto e Treinamento IA                Bloqueado para Produto e IA
  ───────────────────────────────                ───────────────────────────
  • BNCC / MEC (Atos Oficiais)                   • Provas INEP / ENEM (Sob Análise)
  • OpenStax (CC-BY 4.0)                         • Olimpíadas (CC-BY-NC-SA 4.0)
  • PhET Simulations (CC-BY 4.0)                 • PISA, TIMSS e NAEP
  • Autoria Própria Áquila Pro                   • Livros de Editoras Comerciais
```

### 4.1 Avaliações Oficiais (ENEM, INEP e Vestibulares)
> **Condição Específica de Uso:**  
> Avaliações oficiais utilizadas conforme condições específicas de cada fonte. A classificação por item depende da origem, autoria, imagens e termos de uso aplicáveis. Nenhum item entra no acervo comercial sem registro de fonte, data de coleta, permissão e responsável pela aprovação.
- **Classificação:** 🟡 **TIER 2 / QUARENTENA AUDITADA**. Itens com textos motivadores ou ilustrações de terceiros protegidos por copyright permanecem em quarentena até auditoria e expurgo de conteúdo protegido.

### 4.2 Olimpíadas Científicas (OBA, OBMEP, Canguru de Matemática)
> **Condição Específica de Uso:**  
> Olimpíadas CC-BY-NC-SA 4.0 — Tier 2 / Uso não comercial ou mediante autorização. Bloqueadas para distribuição em produto comercial e para treinamento de modelos do Áquila.
- **Classificação:** 🔴 **TIER 2 / QUARENTENA ESTRITA**. Proibida a inclusão no bundle comercial ou uso em datasets SFT/LoRA sem licenciamento expresso prévio.

### 4.3 Recursos Educacionais Abertos (OpenStax e PhET)
- **Licença:** Creative Commons Attribution 4.0 International (CC-BY 4.0).
- **Classificação:** 🟢 **TIER 1 / PERMITIDO COM ATRIBUIÇÃO**. Preservação obrigatória de créditos aos autores originais e hiperlink da licença nos cadernos diagramados.

### 4.4 Livros Didáticos Comerciais de Editoras Privadas
- **Bases:** Editora Scipione, Sistema Bernoulli, Editora Moderna, Editora Ática, Editora Saraiva.
- **Classificação:** 🔴 **TIER 2 / QUARENTENA ABSOLUTA (Art. 29 da Lei nº 9.610/98)**.
- **Regra:** Proibida qualquer ingestão de texto ou imagem para treinamento de IA. Permitidos unicamente metadados de catálogo PNLD (ISBN, título e ementa) para referência dos professores.

---

## 🤖 5. Inventário de Modelos de Inteligência Artificial

Conforme auditado em [`model-licenses.json`](file:///c:/aquila/model-licenses.json), os modelos de aprendizado de máquina possuem termos de uso dedicados:

| Modelo | Provedor / Arquitetura | Versão | Licença | Classificação | Escopo de Execução | Termos e Restrições |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| **Gemma 2** | Google DeepMind | 9B Instruct | Gemma Terms of Use | 🟡 PERMITIDO COM CONDIÇÕES | Edge NPU Local / NIM | Permitido para uso comercial e acadêmico; vedado uso para geração abusiva. |
| **Llama 3.1** | Meta AI | 8B Instruct | Meta Llama 3.1 Community | 🟡 PERMITIDO COM CONDIÇÕES | Ollama Local / Swarm GPU | Exige menção 'Built with Llama'. Teto comercial de 700M MAU. |
| **Qwen 2.5 Coder** | Alibaba Cloud / Qwen | 32B Instruct | Apache-2.0 | 🟢 PERMITIDO | Remote Cluster (Colab A100) | Licença permissiva para código e raciocínio lógico. |
| **DeepSeek R1** | DeepSeek AI | Distill 32B | MIT License | 🟢 PERMITIDO | Remote Cluster (NIM Endpoint) | Permissiva para destilação e inferência comercial. |
| **Minimax Text 01** | MiniMax | Text-01 API | Hosted API Agreement | 🟡 PERMITIDO COM CONDIÇÕES | Remote Cloud API Only | Acesso via API autenticada; nenhum peso redistribuído localmente. |

---

## 🛡️ 6. Endurecimento do CI e Automação de Verificação

A conformidade contínua de licenciamento é verificada pelo script [`scripts/audit_distribution_package.ts`](file:///c:/aquila/scripts/audit_distribution_package.ts), que bloqueia a geração de qualquer release candidate se:
1. Surgir dependência em runtime sob licenças proibidas (GPL, AGPL, SSPL);
2. Existir arquivo sem correspondente no [`content-rights-register.json`](file:///c:/aquila/content-rights-register.json);
3. Ocorrer divergência entre o lockfile único ([`pnpm-lock.yaml`](file:///c:/aquila/pnpm-lock.yaml)) e o manifesto CycloneDX.

---
*Assinado digitalmente: Comitê de Governança Jurídica & Auditoria Regulatória Áquila Pro*  
*Documento vinculado à Release Candidate v2.1.0-rc.32 (Commit `cf859b57`)*