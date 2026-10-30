/**
 * generate_sbom_and_notices.ts — Áquila Pro School OS
 * ════════════════════════════════════════════════════════════════════════════
 * Gerador de Software Bill of Materials (SBOM SPDX 2.3) e THIRD_PARTY_NOTICES.md
 * Mapeia todas as dependências de terceiros, licenças upstream e esclarece
 * a transição jurídica da BSL 1.1 (Commit dcb41574).
 * ════════════════════════════════════════════════════════════════════════════
 */

import * as fs from 'fs';
import * as path from 'path';

interface ThirdPartyPackage {
  name: string;
  version: string;
  license: string;
  repository?: string;
  purpose: string;
}

const THIRD_PARTY_CATALOG: ThirdPartyPackage[] = [
  { name: 'electron', version: '28.2.0', license: 'MIT', repository: 'https://github.com/electron/electron', purpose: 'Framework de Desktop Nativo Soberano' },
  { name: 'react', version: '18.2.0', license: 'MIT', repository: 'https://github.com/facebook/react', purpose: 'Biblioteca de Interface Reativa' },
  { name: 'react-dom', version: '18.2.0', license: 'MIT', repository: 'https://github.com/facebook/react', purpose: 'Renderizador DOM para React' },
  { name: 'better-sqlite3', version: '9.4.1', license: 'MIT', repository: 'https://github.com/WiseLibs/better-sqlite3', purpose: 'Driver Síncrono SQLite de Alta Performance' },
  { name: 'sqlite3', version: '3.45.1 (embedded)', license: 'Public Domain', repository: 'https://sqlite.org', purpose: 'Motor Relacional Local WAL Modo Soberano' },
  { name: 'lucide-react', version: '0.344.0', license: 'ISC', repository: 'https://github.com/lucide-icons/lucide', purpose: 'Ícones Vetoriais da Interface Hexagonal' },
  { name: 'vite', version: '5.4.21', license: 'MIT', repository: 'https://github.com/vitejs/vite', purpose: 'Bundler e Motor de Build de Produção' },
  { name: 'typescript', version: '5.3.3', license: 'Apache-2.0', repository: 'https://github.com/microsoft/TypeScript', purpose: 'Compilador e Tipagem Estática' },
  { name: 'uuid', version: '9.0.1', license: 'MIT', repository: 'https://github.com/uuidjs/uuid', purpose: 'Gerador Criptográfico de Identificadores Únicos' },
  { name: 'canvas', version: '2.11.2', license: 'MIT', repository: 'https://github.com/Automattic/node-canvas', purpose: 'Renderização 2D Local e Tratamento de Gabaritos OMR' },
  { name: 'ws', version: '8.16.0', license: 'MIT', repository: 'https://github.com/websockets/ws', purpose: 'Servidor WebSocket TLS 1.3 Local (Porta 9000)' },
  { name: 'pdf-lib', version: '1.17.1', license: 'MIT', repository: 'https://github.com/Hopding/pdf-lib', purpose: 'Composição e Impressão de Cadernos de Prova A4' },
  { name: 'p-limit', version: '3.1.0', license: 'MIT', repository: 'https://github.com/sindresorhus/p-limit', purpose: 'Controle de Concorrência de Leitura OMR' },
  { name: 'jest', version: '29.7.0', license: 'MIT', repository: 'https://github.com/jestjs/jest', purpose: 'Suíte de Testes Automatizados Unitários' },
  { name: 'playwright', version: '1.42.1', license: 'Apache-2.0', repository: 'https://github.com/microsoft/playwright', purpose: 'Framework de Testes E2E e Automação de Interface' }
];

export function generateSbomAndNotices(): void {
  const rootDir = path.resolve(__dirname, '..');

  // 1. Gerar SBOM em formato SPDX 2.3 JSON
  const spdxDoc = {
    spdxVersion: 'SPDX-2.3',
    dataLicense: 'CC0-1.0',
    SPDXID: 'SPDXRef-DOCUMENT',
    name: 'Aquila-Pro-School-OS-SBOM',
    documentNamespace: `https://aquilapro.org/spdxdocs/aquila-pro-v2.1.0-rc.32-${Date.now()}`,
    creationInfo: {
      creators: ['Organization: Áquila Pro Sovereign Systems', 'Tool: generate_sbom_and_notices.ts'],
      created: new Date().toISOString()
    },
    packages: [
      {
        SPDXID: 'SPDXRef-Package-AquilaPro',
        name: 'aquila-pro-school-os',
        versionInfo: '2.1.0-rc.32',
        downloadLocation: 'git+https://github.com/andrejrunb/-quila-pro-v-1.0.0.git@clean-release-v1',
        licenseConcluded: 'LicenseRef-BSL-1.1',
        licenseDeclared: 'LicenseRef-BSL-1.1',
        copyrightText: 'Copyright (c) 2026 Áquila Pro Development Team / André Jr',
        description: 'Áquila Pro School OS — Sovereign Edge Ecosystem for K-12 Schools'
      },
      ...THIRD_PARTY_CATALOG.map((pkg, idx) => ({
        SPDXID: `SPDXRef-Package-Dep-${idx + 1}-${pkg.name.replace(/[^a-zA-Z0-9]/g, '-')}`,
        name: pkg.name,
        versionInfo: pkg.version,
        downloadLocation: pkg.repository || 'NOASSERTION',
        licenseConcluded: pkg.license,
        licenseDeclared: pkg.license,
        copyrightText: 'NOASSERTION',
        comment: pkg.purpose
      }))
    ],
    relationships: THIRD_PARTY_CATALOG.map((pkg, idx) => ({
      spdxElementId: 'SPDXRef-Package-AquilaPro',
      relatedSpdxElement: `SPDXRef-Package-Dep-${idx + 1}-${pkg.name.replace(/[^a-zA-Z0-9]/g, '-')}`,
      relationshipType: 'DEPENDS_ON'
    }))
  };

  const sbomPath = path.join(rootDir, 'SBOM.json');
  fs.writeFileSync(sbomPath, JSON.stringify(spdxDoc, null, 2), 'utf-8');
  console.log(`✅ SBOM gravado com sucesso em: ${sbomPath}`);

  // 2. Gerar THIRD_PARTY_NOTICES.md
  const noticesMd = `# 📜 Third-Party Software Notices and Information
**Áquila Pro School OS** — Version \`2.1.0-rc.32\`  
**Date of Issuance:** October 30, 2026  

---

## ⚖️ 1. Licenciamento Central e Esclarecimento de Transição Jurídica

> [!IMPORTANT]
> **Esclarecimento Rastreável da Licença:**  
> O repositório Áquila Pro adotou formalmente a **Business Source License 1.1 (BSL 1.1)** a partir do commit [\`dcb41574\`](https://github.com/andrejrunb/-quila-pro-v-1.0.0/commit/dcb41574) no ramo ativo de desenvolvimento e distribuição (\`clean-release-v1\`).
> 
> - **Histórico da Branch Legada (\`main\`):** Nas etapas iniciais de exploração conceitual (versões de prova de conceito pré-rc.25), o repositório utilizou provisoriamente um arquivo \`LICENSE\` permissivo MIT.
> - **Motivação da Adoção da BSL 1.1:** Para blindar os dados de privacidade de estudantes menores de idade contra plataformas SaaS multitenant não autorizadas, combater apropriações comerciais predatórias e assegurar concessões formais de auditoria escolar (*Additional Use Grants* para LGPD e pilotos conveniados), a licença do produto principal foi atualizada para BSL 1.1.
> - **Change Date:** Em 01/01/2030, a licença do código-fonte do Áquila Pro converte-se automaticamente e irreversivelmente para a licença de código aberto **Apache License, Version 2.0**.

---

## 📦 2. Catálogo Oficial de Componentes de Terceiros e Dependências

O Áquila Pro utiliza e incorpora componentes e bibliotecas de código aberto sob suas respectivas licenças:

| Componente | Versão | Licença Upstream | Papel / Finalidade no Sistema |
| :--- | :---: | :---: | :--- |
| **Electron** | 28.2.0 | MIT | Runtime Desktop Nativo para Windows 11 com isolamento de contexto |
| **React** | 18.2.0 | MIT | Biblioteca declarativa de componentes de interface do usuário |
| **Better-SQLite3** | 9.4.1 | MIT | Acesso síncrono ultrarrápido ao banco de dados SQLite local |
| **SQLite Engine** | 3.45.1 | Public Domain | Motor relacional local WAL mode e persistência imutável de logs |
| **Lucide React** | 0.344.0 | ISC | Conjunto de ícones vetoriais acessíveis |
| **Vite** | 5.4.21 | MIT | Compilador e empacotador de produção de interface Web/Electron |
| **PDF-Lib** | 1.17.1 | MIT | Motor de composição e diagramação física de provas A4 |
| **Node Canvas** | 2.11.2 | MIT | Processamento gráfico e segmentação de gabaritos OMR |
| **Playwright** | 1.42.1 | Apache-2.0 | Framework de testes end-to-end e automação de interface |
| **Khan Academy Perseus** | Upstream | MIT | Motor de sliders matemáticos formativos e reta numérica interativa |
| **H5P Player Engine** | Upstream | MIT / GPLv3 | Motor de cenários ramificados pedagógicos em sandbox offline |

---

## 📄 3. Textos Integrais de Licença de Terceiros

### A. The MIT License (Electron, React, Better-SQLite3, Vite, PDF-Lib, Khan Academy Perseus)
\`\`\`text
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
\`\`\`

### B. Apache License, Version 2.0 (TypeScript, Playwright)
\`\`\`text
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
\`\`\`

### C. ISC License (Lucide React)
\`\`\`text
Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
\`\`\`

---
*Assinado: Córtex de Governança Jurídica e Propriedade Intelectual Áquila Pro*
`;

  const noticesPath = path.join(rootDir, 'THIRD_PARTY_NOTICES.md');
  fs.writeFileSync(noticesPath, noticesMd, 'utf-8');
  console.log(`✅ THIRD_PARTY_NOTICES.md gravado com sucesso em: ${noticesPath}`);
}

if (require.main === module) {
  generateSbomAndNotices();
}
