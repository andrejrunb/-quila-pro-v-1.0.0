# Implementation Plan: Phase 1601 — Swarm Remediation & System Hardening

Este plano orquestra a resolução de dívidas técnicas e erros de linting identificados através do **Áquila Swarm**, dividindo as tarefas entre agentes especializados.

## Swarm Task Assignment

### 🛡️ Security Agent (SecAgent)
*Foco: Hardening de Acessibilidade e Segurança de UI.*
- [ ] **LockdownPanel.tsx**: Corrigir `aria-pressed` para garantir valor booleano puro (conforme W3C).
- [ ] **SetupWizard.tsx**: Corrigir `aria-busy` e `aria-selected` para valores válidos.
- [ ] **IoTManager.tsx**: Resolver erros de `aria-selected` em abas de gestão.
- [ ] **TeacherDashboard.css**: Adicionar suporte a `-webkit-backdrop-filter` para compatibilidade Safari/iOS.

### 🎓 Pedagogical Agent (PedAgent)
*Foco: UI Aesthetics e Conformidade Visual.*
- [ ] **ClimateReportPanel.tsx**: Migrar estilos inline (intensity-bar) para o CSS oficial.
- [ ] **ReportingHub.tsx**: Eliminar estilos inline remanescentes.
- [ ] **UnitSelector.tsx**: Adicionar `title` ou `aria-label` e corrigir `aria-expanded`.
- [ ] **NPSModal.tsx**: Ajustar `aria-pressed` em botões de feedback.

### ⚙️ Infrastructure Agent (InfraAgent)
*Foco: Repo Health e Mobile Type Safety.*
- [ ] **GuardDashboard.tsx (Mobile)**: Corrigir erro de tipagem em estilos aninhados (StyleSheet vs ViewStyle).
- [ ] **task.md / walkthrough_v1600.md**: Limpar avisos de formatação markdown e URLs.
- [ ] **Brain Sync**: Sincronizar diretórios e resolver discrepâncias de caminhos de imagens.

## Verification Plan

### Automated Tests
- `npm run lint`: Verificar que todos os arquivos TS/TSX retornam zero erros de ARIA/CSS.
- `npm run tsc`: Validar que o projeto mobile compila sem erros de overload de estilos.

### Manual Verification
- Testar navegação por teclado no `LockdownPanel` para confirmar que leitores de tela capturam o estado corretamente.
