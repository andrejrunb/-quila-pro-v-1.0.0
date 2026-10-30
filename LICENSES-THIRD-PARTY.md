# Licenças de Terceiros e Segregação de Propriedade Intelectual (Áquila Pro)

Este documento cataloga todos os softwares de código aberto de terceiros, bibliotecas, motores de conteúdo pedagógico e acervos didáticos incorporados ou referenciados no ecossistema **Áquila Pro**, em conformidade com as exigências legais de atribuição, preservação de direitos autorais e conformidade com a Lei Federal nº 9.610/98 (Lei de Direitos Autorais) e Lei Federal nº 13.709/2018 (LGPD).

---

## Sumário Executivo de Componentes

| Componente / Módulo | Origem / Mantenedor | Licença Upstream | Papel no Áquila Pro | Status de Conformidade |
| :--- | :--- | :--- | :--- | :--- |
| **Khan Academy Perseus** | Khan Academy | MIT License | Motor Offline de Itens Interativos & Sliders Matemáticos | Homologado (Tier 1 / Offline-First) |
| **H5P Player Engine** | Joubel AS / H5P Group | MIT / GNU GPL v3 | Player de Branching Scenarios, Drag Words e Hotspots | Homologado (Tier 1 / Sandbox Local) |
| **Acervo Oficial de Provas** | INEP, FUVEST, UNICAMP, ITA, PISA | Domínio Público / Art. 8º LDA | Banco de Avaliações Oficiais de Estado | Homologado (Tier 1 / Liberado) |
| **Olimpíadas Acadêmicas** | OBA, OBMEP, Canguru | CC-BY-NC-SA 4.0 / Open Exam | Banco de Desafios Formativos e Raciocínio Lógico | Homologado (Tier 1 / Liberado) |
| **Recursos Educacionais Abertos** | OpenStax, PhET (Univ. Colorado) | CC-BY 4.0 | Matrizes Curriculares e Simulações Interativas | Homologado (Tier 1 / Liberado) |
| **Acervo Didático de Editoras Privadas** | Scipione, Bernoulli, Moderna, Ática | Direitos Reservados (Art. 29 LDA) | Referência Bibliográfica Exclusiva | **QUARENTENA ESTRITA (Tier 2 / Bloqueado para IA)** |
| **Desktop / UI Runtime** | Electron, React, Node.js, Vite | MIT / BSD-3-Clause | Execução Nativa Desktop e Interfaces Reativas | Homologado (Tier 1) |
| **Mobile Runtime** | Expo, React Native | MIT License | Companion App Mobile para Alunos e Famílias | Homologado (Tier 1) |
| **Banco de Dados & Armazenamento** | SQLite, better-sqlite3, Drizzle ORM | Public Domain / MIT / Apache 2.0 | Persistência Edge-First, WAL e Criptografia Local | Homologado (Tier 1) |
| **Comunicação Peer-to-Peer** | libp2p, @chainsafe/libp2p-noise | Apache-2.0 / MIT | Malha P2P Soberana de Sincronização Local | Homologado (Tier 1) |

---

## 1. Motores Pedagógicos Interativos (Perseus & H5P)

### 1.1 Khan Academy Perseus
- **Repositório Upstream:** `Khan/perseus` (Khan Academy)
- **Licença:** MIT License
- **Implementação no Áquila Pro:** [`apps/electron/src/services/H5PPerseusEngine.ts`](file:///c:/aquila/apps/electron/src/services/H5PPerseusEngine.ts), [`apps/electron/src/ui/portals/H5PPerseusPortal.tsx`](file:///c:/aquila/apps/electron/src/ui/portals/H5PPerseusPortal.tsx)
- **Funcionalidades Utilizadas:**
  - `perseus_math_slider`: Sliders paramétricos para funções algébricas e cinemática física.
  - `perseus_number_line`: Reta numérica interativa com tolerância delta configurável.
  - `perseus_radio_scaffolding`: Múltipla escolha formativa com 3 níveis de dicas socráticas progressivas.
- **Isolamento de Segurança:** O motor foi refatorado para execução 100% offline-first sem requisições de rede para servidores externos ou CDNs, garantindo imunidade a rastreamento de dados de alunos (LGPD Art. 14).

```text
The MIT License (MIT)

Copyright (c) 2013-2026 Khan Academy

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE WORK OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### 1.2 H5P Interactive Content Engine
- **Repositório Upstream:** `h5p/h5p-core` (Joubel AS / H5P Group)
- **Licenças:** MIT License (H5P Core / Interactive Libraries) e GNU GPL v3 (módulos de plataforma)
- **Implementação no Áquila Pro:** [`apps/electron/src/services/H5PPerseusEngine.ts`](file:///c:/aquila/apps/electron/src/services/H5PPerseusEngine.ts)
- **Tipos de Conteúdo Habilitados:**
  - `h5p_branching_scenario`: Árvore de decisão e caminhos pedagógicos ramificados.
  - `h5p_image_hotspots`: Pontos quentes explicativos em diagramas científicos anatômicos e cartográficos.
  - `h5p_drag_words`: Associação de vocabulário e conceitos estruturados em lacunas.
- **Fronteira Arquitetural:** Os pacotes interativos são empacotados em contêiner offline isolado e comunicam-se com o núcleo do Áquila via IPC desacoplado e mensagens padronizadas JSON, respeitando as fronteiras de licença dinâmica.

---

## 2. Acervo de Provas, Recursos Educacionais Abertos e Segregação de Direitos

O Áquila Pro implementa um rigoroso modelo de partição e segregação de dados pedagógicos estruturado em dois níveis estritos:

```
                      ACERVO MULTIMODAL ÁQUILA
                                 │
         ┌───────────────────────┴───────────────────────┐
         ▼                                               ▼
   TIER 1 (LIBERADO)                            TIER 2 (QUARENTENA)
  Treinamento SFT, RAG & Offline Core         Apenas Referência Bibliográfica
  ───────────────────────────────────         ───────────────────────────────
  • Provas Oficiais de Estado (Art. 8º LDA)   • Livros Didáticos Comerciais
  • Olimpíadas Abertas (CC-BY-NC-SA 4.0)        (Scipione, Bernoulli, Moderna,
  • OpenStax & PhET (CC-BY 4.0)                 Ática, Saraiva)
  • Arte Própria Equipe Áquila (12 Campos)    • BLOQUEADO PARA TREINAMENTO IA
```

### 2.1 TIER 1 — Liberado para Treinamento de IA / SFT, Fine-Tuning e Distribuição Offline
1. **Avaliações Oficiais de Estado (Domínio Público / Atos Oficiais):**
   - **Bases:** ENEM (Exame Nacional do Ensino Médio), Provas Oficiais INEP, Vestibulares Oficiais FUVEST, UNICAMP, ITA, UERJ.
   - **Fundamentação Legal:** Art. 8º, inciso IV da Lei Federal nº 9.610/98 (*"Não são objeto de proteção como direitos autorais de que trata esta Lei: [...] os textos de tratados ou convenções, leis, decretos, regulamentos, decisões judiciais e demais atos oficiais"*).
2. **Avaliações Governamentais Internacionais:**
   - **Bases:** PISA (OCDE), TIMSS (IEA), NAEP (U.S. National Assessment of Educational Progress).
   - **Status:** Itens de divulgação pública (*Public Release Items*) para fins educacionais e científicos.
3. **Olimpíadas Científicas Oficiais Abertas:**
   - **Bases:** OBA (Olimpíada Brasileira de Astronomia), OBMEP (IMPA/SBM), Canguru de Matemática Brasil.
   - **Licença:** Creative Commons Atribuição-NãoComercial-CompartilhaIgual (CC-BY-NC-SA 4.0) e provas oficiais de livre distribuição acadêmica com preservação de créditos.
4. **Recursos Educacionais Abertos (OER / REA):**
   - **OpenStax (Rice University):** Licença Creative Commons Attribution 4.0 International (CC-BY 4.0).
   - **PhET Interactive Simulations (University of Colorado Boulder):** Licença Creative Commons Attribution 4.0 International (CC-BY 4.0).
5. **Autoria Própria do Ecossistema Áquila:**
   - Matrizes de Habilidades dos 12 Campos de Avaliação, Scaffolding Socrático, Algoritmos de Calibração OMR e Exercícios Inéditos elaborados pelos pesquisadores do projeto Áquila Pro (Copyright © 2026 Áquila Pro Development Team).

### 2.2 TIER 2 — Quarentena Estrita / Bloqueado para Treinamento / Referência Bibliográfica
- **Materiais Afetados:** Livros didáticos comerciais de editoras privadas (ex.: Editora Scipione, Sistema Bernoulli, Editora Moderna, Editora Ática, Editora Saraiva) catalogados a partir de repositórios como AGPTEA ou bibliotecas escolares.
- **Fundamentação Legal:** Art. 29 da Lei nº 9.610/98 (*"Depende de autorização prévia e expressa do autor a utilização da obra, por quaisquer modalidades, tais como: I - a reprodução parcial ou integral; [...] VIII - a utilização, direta ou indireta, da obra literária, artística ou científica"*).
- **Diretriz de Governança Aplicada:**
  - **Quarentena Completa:** Nenhum parágrafo, texto ou diagrama dessas obras é ingerido para fine-tuning, pré-treinamento de modelos LLM locais (Gemma 2 / Llama 3) ou incluído em datasets SFT no Google Colab A100.
  - **Acesso Restrito:** Apenas metadados de catálogo (Título, Autor, ISBN, Ano e Ementa do PNLD) permanecem no banco de dados SQLite como referência bibliográfica recomendada aos docentes.

---

## 3. Runtime, Frameworks e Bibliotecas do Core do Sistema

### 3.1 Electron, Node.js e React Runtime
- **Electron:** MIT License — Copyright (c) Electron contributors / GitHub Inc.
- **Node.js:** MIT License — Copyright Node.js contributors.
- **React & React DOM:** MIT License — Copyright (c) Meta Platforms, Inc. and affiliates.
- **Vite:** MIT License — Copyright (c) 2019-present Evan You & Vite Contributors.
- **Next.js:** MIT License — Copyright (c) 2026 Vercel, Inc.
- **Tailwind CSS:** MIT License — Copyright (c) Tailwind Labs, Inc.
- **Expo & React Native:** MIT License — Copyright (c) 650 Industries / Meta Platforms, Inc.

### 3.2 Visualização 3D, Animações e Gráficos
- **Three.js:** MIT License — Copyright (c) 2010-2026 Three.js Authors.
- **@react-three/fiber & @react-three/drei:** MIT License — Copyright (c) 2019 Paul Henschel.
- **Konva & react-konva:** MIT License — Copyright (c) Anton Lavrenov.
- **Recharts & ApexCharts:** MIT License — Copyright (c) Recharts Group / ApexCharts.
- **Anime.js:** MIT License — Copyright (c) Julian Garnier.
- **Lucide Icons:** ISC License — Copyright (c) Lucide Project.

### 3.3 Banco de Dados, Indexação e Persistência Edge
- **SQLite Engine:** Public Domain — Dedicated to the public domain by D. Richard Hipp.
- **better-sqlite3:** MIT License — Copyright (c) 2017 Joshua Wise.
- **Drizzle ORM & Drizzle Kit:** Apache License 2.0 / MIT License — Copyright (c) Drizzle Team.
- **MiniSearch:** MIT License — Copyright (c) Luca Ongaro.
- **pdf-lib:** MIT License — Copyright (c) Andrew Dillon.
- **Sharp:** Apache License 2.0 — Copyright (c) Lovell Fuller.

### 3.4 Conectividade Soberana P2P e Criptografia
- **libp2p Core Stack (`libp2p`, `@chainsafe/libp2p-noise`, `@libp2p/tcp`, `@libp2p/mplex`, `@libp2p/mdns`):**
  - Licença: Apache License 2.0 e MIT License — Copyright (c) Protocol Labs & ChainSafe Systems.
- **bcryptjs:** MIT License — Copyright (c) Daniel Bikiel.
- **crypto-js:** MIT License — Copyright (c) Jeff Mott.
- **uuid:** MIT License — Copyright (c) 2010-2020 Robert Kieffer and other contributors.

---

## 4. Auditoria de Conformidade e Declaração de Integridade

O Áquila Pro mantém trilhas de auditoria criptográfica baseadas em SHA-256 e SQLite Write-Ahead Logging (WAL) para cada componente e dataset carregado. Escolas parceiras, encarregados de proteção de dados (DPOs) e auditores governamentais têm a faculdade de verificar a integridade deste inventário através dos scripts de auditoria em [`scripts/`](file:///c:/aquila/scripts/) e relatórios homologados em [`test-results/`](file:///c:/aquila/test-results/).

Para esclarecimentos sobre propriedade intelectual ou solicitações de licença comercial, contate:
**Áquila Pro Development Team / André Jr**  
E-mail: `andrejrunb@yahoo.com.br`
