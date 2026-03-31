---
title: Auditoria de Acessibilidade (A11y)
tags: [ui, a11y, compliance]
last_update: 2026-03-24
---

# Auditoria de Acessibilidade (A11y)

Documentação das melhorias de acessibilidade implementadas para garantir que o Áquila Pro seja utilizável por todos.

## 🛠️ Correções Realizadas

### Atributos ARIA
Os componentes abaixo foram corrigidos para evitar a passagem de booleanos para atributos ARIA, o que causava falhas em leitores de tela:
- **NPSModal:** `aria-pressed` agora é string ('true'|'false').
- **SetupWizard:** `aria-busy` e `aria-selected` devidamente tipados como strings.

### Labels e Descrição
- **Campos de Formulário:** Adicionado `aria-label` e `title` em inputs complexos no `ScheduleGrid` e `ClassroomManagement`.
- **Botões de Ícone:** Botões sem texto visível no `FinanceModule` e `VisitorManagement` agora possuem nomes acessíveis descritivos.

## 🎨 Consistência Elite UI
A refatoração removeu estilos inline dos seguintes componentes, movendo-os para arquivos CSS dedicados e padronizando efeitos de transparência e blur:
- [[EmptyState]]
- [[HelpModal]]
- [[Skeleton]]
- [[NPSModal]]

## ♿ Padrões Seguidos
- [x] WCAG 2.1 Level AA
- [x] Navegação por teclado completa
- [x] Suporte a alto contraste e Dark Mode premium

---
Vincular a: [[30_UI_UX/Design_System|Design System]]
