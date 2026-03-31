# Implementation Plan: Phase 1400 — Enterprise Reporting (PDF Export)

Este plano visa dotar o Áquila Pro de capacidades de relatórios profissionais, permitindo que escolas exportem dados de presença, comportamento e segurança em formato PDF de alta qualidade.

## Objetivos
1. **Relatórios Profissionais**: Gerar PDFs com cabeçalho da escola, logos e formatação limpa.
2. **Integração de Mídia**: Incluir fotos dos alunos e gráficos básicos de presença.
3. **Automação**: Permitir o download instantâneo de relatórios de aula logo após o término.

### [Componentes Principais]

#### [MODIFY] [ReportGenerator.ts](file:///c:/aquila/aquilapro_electron/src/services/ReportGenerator.ts)
- Adicionar suporte a `pdf-lib` para gerar documentos PDF.
- Implementar métodos `generateStudentReport(studentId)` e `generateClassReport(classId)`.
- Adicionar lógica para embutir fontes e imagens (logos).

#### [NEW] [ReportTemplates.ts](file:///c:/aquila/aquilapro_electron/src/services/reports/ReportTemplates.ts)
- Definição de layouts CSS-like ou coordenadas para o `pdf-lib`.
- Estrutura de cabeçalho padrão Áquila Pro.

#### [MODIFY] [TeacherDashboard.tsx](file:///c:/aquila/aquilapro_electron/src/ui/pages/TeacherDashboard.tsx)
- Adicionar botão "Exportar PDF" nas visualizações de relatório.

## Plano de Verificação

### Testes Automatizados
- Verificar se o arquivo `.pdf` é criado no diretório de saída.
- Validar se o tamanho do arquivo gerado é razoável (<2MB para relatórios padrão).

### Verificação Manual
- Abrir o PDF gerado e verificar:
  - Alinhamento de texto.
  - Carregamento correto de imagens.
  - Legibilidade das cores.
