# Guia Mestre de Integração Figma & Design System — Áquila Pro

Este documento estabelece o padrão oficial de arquitetura, sincronização e uso do **Figma** no ecossistema **Áquila Pro**, conectando o código-fonte React/TypeScript diretamente à plataforma Figma através do **Model Context Protocol (MCP)**, **Code Connect** e **Design Tokens (DTCG)**.

---

## 📌 1. Visão Geral e FigJam Live Board

O diagrama de arquitetura do fluxo completo do Design System do Áquila Pro com o Figma está publicado e disponível no time do Figma:

> 🔗 **FigJam Live Board:** [Áquila Pro — Arquitetura de Design System e Figma](https://www.figma.com/board/vMaEJLFI3UiQKUH05ZqQXR)

### Topologia de Integração

```
┌──────────────────────────────────────┐     ┌────────────────────────────────────┐
│      Código Áquila Pro (CSS)         │     │       Figma Design System          │
│  - aquila-ui-tokens.css              │ ──> │  - Coleções de Variáveis           │
│  - aquila-accessible-ui.css (WCAG)   │     │    * Primitives, Dark, Light, Spc  │
└──────────────────┬───────────────────┘     └─────────────────┬──────────────────┘
                   │                                           │
         pnpm run figma:tokens                         Code Connect
                   │                                           │
┌──────────────────▼───────────────────┐     ┌─────────────────▼──────────────────┐
│   aquila-tokens.figma.json (DTCG)    │ <── │  Templates Code Connect (.figma.ts)│
│   Compatível com Tokens Studio       │     │  EagleButton, EagleCard, Sidebar   │
└──────────────────────────────────────┘     └────────────────────────────────────┘
```

---

## 🎨 2. Coleções de Tokens & Variáveis (Figma Variables)

Os tokens do Áquila Pro seguem o padrão **DTCG (Design Tokens Community Group)** e estão divididos em 4 coleções principais no arquivo `apps/electron/src/ui/design/tokens/aquila-tokens.figma.json`:

### 2.1. Coleção 01: Primitives (Paleta Base)
- **Blue Scale (`50` a `900`)**: Cor de destaque primária da interface escolar.
- **Slate Scale (`50` a `950`)**: Escala de neutros para o tema escuro Obsidian e superfícies suaves.
- **Semantic Accents**:
  - `Cyan (500: #06b6d4)`: Informações e telemetria.
  - `Emerald (500: #10b981)`: Presença confirmada, sucesso e conformidade.
  - `Amber (500: #f59e0b)`: Alertas de infrequência LDB e atenção.
  - `Red (500: #ef4444)`: Risco crítico e ocorrências.
  - `Yellow (300: #fde047)`: Anel de foco obrigatório WCAG 2.2 AAA.
- **Spacing Scale (múltiplos de 4px)**: `4px`, `8px`, `12px`, `16px`, `20px`, `24px`, `32px`, `40px`, `48px`, `64px`.
- **Radii Scale**: `4px` (sm), `8px` (md), `12px` (lg), `16px` (xl), `9999px` (full).

### 2.2. Coleção 02: Semantic Themes (Dark Obsidian vs Light)
O Áquila Pro suporta dois modos operacionais semânticos:
- **Dark Obsidian (Padrão para Salas de Comando e Servidores Edge)**:
  - Base: `#090c12`
  - Canvas: `#0b1220`
  - Painéis / Vidro: `#121824` com `backdrop-filter: blur(20px)`
  - Texto 1 (Título / KPI): `#f1f5f9` (Contraste 16.2:1 — WCAG AAA)
  - Texto 2 (Corpo): `#cbd5e1` (Contraste 11.8:1 — WCAG AAA)
  - Texto 3 (Secundário): `#a3b2c7` (Contraste 7.9:1 — WCAG AAA, substitui o antigo `#64748b`)
- **Light Theme (Secretaria e Impressão de Boletins)**:
  - Base / Canvas: `#f6f8fb`
  - Painéis: `#ffffff`
  - Texto Primário: `#172033` (Contraste 15.5:1 sobre branco)
  - Bordas de controle: `#64748b`

### 2.3. Coleção 03: Typography & Tabular Numerals
- **Família Sans**: `Inter, system-ui, sans-serif`
- **Família Mono**: `'JetBrains Mono', 'Fira Code', monospace`
- **Tabular Nums**: `font-variant-numeric: tabular-nums slashed-zero` obrigatório em células de notas, frequência, relógios e KPIs financeiros para eliminar trepidação de layout (layout shift / CLS).

### 2.4. Coleção 04: Component Specs & Acessibilidade
- **Área mínima de toque**: `min-height: 44px; min-width: 44px;` (WCAG 2.2 AA).
- **Anel de Foco Visível**: `outline: 2px solid #fde047 !important; outline-offset: 2px !important;`.
- **Respeito ao usuário**: `prefers-reduced-motion` desativa animações contínuas para usuários fotossensíveis.

---

## ⚡ 3. Sincronização Automática de Tokens

Para sincronizar alterações de estilos CSS para o arquivo JSON de tokens do Figma:

```bash
# Na pasta apps/electron:
pnpm run figma:tokens

# Ou a partir da raiz:
node tools/figma-tokens-sync/sync_tokens.js
```

O arquivo gerado é `apps/electron/src/ui/design/tokens/aquila-tokens.figma.json`. Ele pode ser importado diretamente no Figma através do plugin **Tokens Studio for Figma** ou via API de Variáveis do Figma.

---

## 🔗 4. Code Connect (.figma.ts)

O Code Connect vincula componentes de design publicados no Figma aos componentes reais do código React, permitindo que desenvolvedores inspecionem um frame no Figma Dev Mode e copiem o código exato em React com props reais.

### Arquitetura de Arquivos
- Configuração: `figma.config.json`
- Regra obrigatória: Arquivos `.figma.ts` (modelo parserless com `figma.code`), nunca `.figma.tsx`.

### Mapeamentos Implementados (12 Templates Validados em `apps/electron`):
1. `apps/electron/src/ui/components/elite/EagleButton.figma.ts`:
   - Variantes: `primary`, `secondary`, `danger`, `ghost`
   - Tamanhos: `sm`, `md`, `lg`
   - Estados: `glow`, `loading`, `disabled`
2. `apps/electron/src/ui/components/elite/EagleCard.figma.ts`:
   - Variantes: `default`, `kpi`, `alert`, `success`
   - Propriedades: `title`, `glow`, `clickable`, slot `content`
3. `apps/electron/src/ui/components/elite/EagleBadge.figma.ts`:
   - Variantes: `success`, `danger`, `warning`, `info`, `default`
   - Estados: `glow`
4. `apps/electron/src/ui/components/elite/EagleKpiCard.figma.ts`:
   - Propriedades: `title`, `value`, `trendColor`, `glow`, ícone
5. `apps/electron/src/ui/components/elite/EagleModal.figma.ts`:
   - Tamanhos: `sm`, `md`, `lg`; propriedades `title`, `isOpen`, slot `content`
6. `apps/electron/src/ui/components/elite/EagleTable.figma.ts`:
   - Propriedades: `isEmpty`, `emptyMessage`, slot `content`
7. `apps/electron/src/ui/components/elite/EagleToast.figma.ts`:
   - Variantes: `success`, `error`, `warning`, `info`; propriedade `message`
8. `apps/electron/src/ui/components/Sidebar.figma.ts`:
   - Variantes de Hub: `admin`, `pedagogical`, `security`
   - Estados: `isCollapsed`
9. `apps/electron/src/ui/components/TopBar.figma.ts`:
   - Barra superior com busca e perfil do usuário autenticado.
10. `apps/electron/src/ui/components/EmptyState.figma.ts`:
    - Tamanhos: `sm`, `md`, `lg`; propriedades `title`, `description`
11. `apps/electron/src/ui/components/Skeleton.figma.ts`:
    - Tipos: `Card`, `TableRow`, `TextBlock`, `KPICard`, `Avatar`, `Button`
12. `apps/electron/src/ui/components/Tooltip.figma.ts`:
    - Posicionamentos: `top`, `bottom`, `left`, `right`; propriedade `content`, slot `Trigger`

> **Nota `@aquila/web`:** `apps/web/src/components/**/*.figma.ts` já está incluído em `figma.config.json` e `scripts/figma/validate_code_connect.js`, porém permanece em Backlog (`0` templates publicados até vinculação de node URLs do Design System Web no Figma).

---

## 🛠️ 5. Ferramentas Figma MCP Disponíveis no Antigravity

O agente possui integração total com o servidor `figma_figma`:

| Ferramenta MCP | Quando Utilizar | Exemplo de Uso |
|---|---|---|
| `generate_diagram` | Criar fluxogramas, arquiteturas e ERDs no FigJam | Diagramas de rede P2P, fluxo de notas e matrícula |
| `create_new_file` | Criar novos arquivos de design ou FigJam | Iniciar um novo mock de tela para professores |
| `get_design_context` | Ler nós e frames do Figma para gerar código React | Implementar um novo modal ou dashboard a partir do Figma |
| `get_screenshot` | Capturar imagem visual de um frame para conferência | Validar se o código bate com o pixel do Figma |
| `get_variable_defs` | Inspecionar variáveis e modos definidos no arquivo Figma | Validar se as variáveis de cor estão consistentes |
| `use_figma` | Executar scripts da Plugin API para criar nós e layouts | Construir componentes programaticamente no Figma |

---

## 🎯 6. Boas Práticas para Designers e Desenvolvedores

1. **Sempre use as Variáveis Semânticas**: No Figma, nunca aplique cores hexadecimais soltas (ex: `#1e293b`). Use as variáveis da biblioteca (`Surface/Base`, `Text/Primary`, `Action/Primary`).
2. **Mantenha os Alvos de Clique em 44px**: Todos os botões, ícones clicáveis e opções de menu devem ter bounding box mínima de 44×44px.
3. **Não Use Nomes Complexos ou Místicos**: Nas telas, use termos diretos como "Painel de Gestão", "Frequência Escolar", "Notas e Avaliações", "Secretaria Escolar".
4. **Sem Marcas Proprietárias de Terceiros**: Não incluir marcas externas como Positivo, Kumon, Wordwall, Brisk ou PhET nas bibliotecas de componentes ou textos de protótipo. Utilize as nomenclaturas soberanas do Áquila Pro.
