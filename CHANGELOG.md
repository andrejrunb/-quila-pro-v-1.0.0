# Changelog — Áquila Pro

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

---

## [2.1.0] — 2026-08-08

### 🔧 Corrigido
- **IA não respondia (genAIService):** Movido registro do `GenerativeAIService` para Phase 1 do boot em `orchestrator.ts`, eliminando race condition com chamadas IPC.
- **Seletor de turma invisível (Mapa de Assentos):** Adicionado estilo explícito `option { background; color }` em `SeatingIntelligence.css` para dark themes.
- **Alunos não apareciam no mapa de assentos:** Corrigido filtro que ignorava `row === null` (apenas verificava `undefined`).
- **Botão "Distribuir Automático" não funcionava:** Algoritmo melhorado para buscar próximas vagas vazias evitando sobreposição.

### 🎨 Melhorado (UI/UX — Zero-Scroll Priority)
- **Design System Global:** Redução de `--container-padding`, gaps e escalas tipográficas em `index.css` para layout de alta densidade.
- **TaskScheduler:** Layout refatorado para grid horizontal 2 colunas (dados à esquerda, descrição à direita), reduzindo altura do formulário em ~50%.
- **TeacherDailyReport:** Lista de alunos convertida de dropdown para accordion expandível compacto. Aba de conteúdo condensada.
- **Diary (Diário de Classe):** Cards de alunos reduzidos para strips horizontais. Grid da chamada rápida expandido de 5 para 8 colunas, com imagens e textos menores.

### 📱 Separação Desktop / Mobile
- **Aba "Quadro IA":** Ocultada no Sidebar para builds desktop (Electron). Mantida apenas no app mobile.
- **Botão "Ditar Relatório":** Removido da versão PC em `TeacherDailyReport.tsx` e `Diary.tsx`. Disponível apenas no celular via `!(window as any).aquila`.
- **Botão "Autopreencher via IA / Lousa":** Removido do PC no `TeacherDailyReport.tsx`. Preenchimento via foto da lousa apenas no app mobile.
- **Botão "Chamada por Voz":** Ocultado no PC em `Diary.tsx`. Funcionalidade de voz reservada para o dispositivo móvel.

---

## [2.0.0] — 2026-07-xx

### Adicionado
- Cockpits de Inteligência Soberana (Zenith, Empathic, Serendipity, Dreamspace)
- Mesh P2P via libp2p para sincronização entre unidades
- Digital Twin e Federated Learning
- NPU Hardware Optimizer (26 TOPS)
- Wi-Fi DensePose (estimativa de presença sem câmera)
- Módulo Financeiro completo (PIX, inadimplência, forecasting)
- Night Sentry (patrulha noturna automatizada)
- Radar de Evasão preditivo com IA

---

## [1.0.1] — 2026-06-xx

### Adicionado
- Timetable (Grade Horária)
- AI Teacher Log (Registro de Aula via IA)
- PWA Site institucional

---

## [1.0.0] — 2026-05-xx

### Adicionado
- Production Baseline: Zero-Debt UI
- NPU IPC hooks
- LGPD Compliance (matriz de consentimento)
- Core: Auth, Database, SessionService
- Hub Ensino: Diário, Chamada, Tarefas, Relatórios
- Hub Segurança: Câmeras, Alertas, Monitor
- Hub Gestão: Financeiro, Secretaria, Usuários
- 16 Agent Skills soberanas
- Constitution v2.0 (AGENTS.md)
