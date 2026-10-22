# 🎨 Áquila Pro — DESIGN.md (Stitch Orientation)

Este documento define os tokens visuais e princípios estéticos do **Elite Design System** do Áquila Pro, otimizados para o Google Stitch.

---

## 💎 Design Tokens (CSS Variables)

### 1. Paleta de Cores (Dark Mode Elite)
- **Primary**: `#3b82f6` (Vibrant Blue - Confiança e tecnologia)
- **Secondary**: `#6366f1` (Indigo - Inteligência e profundidade)
- **Accent**: `#06b6d4` (Cyan - Detalhes e destaques)
- **Background**: 
  - Slate 900 (`#0f172a`) como base.
  - Deep Slate (`#020617`) para contrastes.
  - Gradiente Radial: `radial-gradient(circle at top left, #1e293b 0%, #0f172a 100%)`.

### 2. Efeitos de Materiais (Glassmorphism)
- **Glass-BG**: `rgba(30, 41, 59, 0.5)`
- **Glass-Blur**: `20px` (ou superior para profundidade aérea)
- **Glass-Border**: `rgba(255, 255, 255, 0.05)` (Subtil e premium)
- **Glass-Glow**: Sombra suave azulada para simular a aura da águia.

### 3. Tipografia (Profissional)
- **Font-Family**: 'Inter', sans-serif.
- **Hierarchy**:
  - H1: `2rem` (Bold, letter-spacing -0.02em)
  - H2: `1.5rem`
  - Body: `0.9375rem` (Foco em legibilidade de dados densos)

---

## 🛠️ Component Patterns

### A. Eagle Card (Glass Card)
- **Estilo**: Bordas arredondadas (`2.5rem`), fundo translúcido, borda fina.
- **Interação**: Elevação suave no hover, aumento do brilho da borda azulada.

### B. KPI Grid
- **Estruturação**: Layout gradeado (`minmax 240px`) com rótulos em Uppercase e valores em negrito puro.

### C. Industrial/Logistics Accents (Phase v3550)
- **Emerald**: `#10b981` para balanço contábil e sucesso.
- **Amber**: `#f59e0b` para alertas e logística (Crate-Grid).

---

## 🦅 Princípios do Stitch
1.  **Vivid & Alive**: A interface deve parecer viva (glows animados e transições de curva cúbica).
2.  **Sovereign Clarity**: O design deve priorizar a clareza de dados críticos de segurança acima de adornos desnecessários.
3.  **Premium Dark**: Manter o contraste alto em fundos escuros, usando o azul como fio condutor da identidade.
