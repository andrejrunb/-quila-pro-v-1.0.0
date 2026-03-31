# Implementation Plan — Phase 900: Teacher Empowerment & Classroom Intelligence

Esta fase foca em transformar a experiência do professor dentro de sala, automatizando tarefas administrativas (chamada e relatórios) através da visão computacional e inteligência de dados do Áquila Pro.

# Undo/Redo Presence Correction System (Step 6)

Implement a robust mechanism for teachers to manually override AI-detected presence/absence with the ability to undo and redo changes during a session.

## Proposed Changes

### Database Component

#### [MODIFY] [Database.ts](file:///c:/aquila/aquilapro_electron/src/database/Database.ts)
- Add `isManual` (BOOLEAN) and `originalType` (TEXT) columns to `attendance_logs`.
- Implement `syncManualPresence` method to batch update logs from the dashboard.

### IPC Component

#### [MODIFY] [handlers.ts](file:///c:/aquila/aquilapro_electron/src/ipc/handlers.ts)
- Register `teacher:bulk-update-presence` to handle the final state of the undo/redo stack when the teacher confirms.

### UI Component

#### [MODIFY] [TeacherDashboard.tsx](file:///c:/aquila/aquilapro_electron/src/ui/pages/TeacherDashboard.tsx)
- Implement state-based history management for student statuses.
- Add "Undo" (Ctrl+Z) and "Redo" (Ctrl+Y) functionality.
- Visual indicators for manually corrected students (e.g., a "pencil" icon).

## Verification Plan

### Automated Tests
- Mock IPC calls for presence updates.
- Verify undo/redo state transitions in React.

### Manual Verification
1. Change a student's status from 'Present' to 'Absent'.
2. Click 'Undo' and verify the status reverts.
3. Click 'Redo' and verify it changes back.
4. Confirm changes and check the database for the `isManual` flag.

## User Review Required

> [!IMPORTANT]
> **API de Análise de Quadro:** Para a "Inteligência de Quadro" (gerar relatório a partir da foto), utilizaremos inicialmente um motor de OCR local. No futuro, podemos integrar com GPT-4o-mini ou Gemini Pro Vision para resumos pedagógicos de alta qualidade.
> 
> **Importação de Planilha:** O sistema aceitará o formato CSV padrão (Disciplina, Professor, Sala, Início, Fim, Dia da Semana).

## Proposed Changes

### [Component: Database]
#### [MODIFY] [Database.ts](file:///c:/aquila/aquilapro_electron/src/database/Database.ts)
- Adicionar tabela `lesson_reports`:
    - `id`, `scheduleId`, `date`, `whiteboardPhotoPath`, `aiSummary`, `teacherNotes`.
- Atualizar tabela `schedules` para incluir `teacherId` (FK para `users.id`).

### [Component: Teacher UI]
#### [NEW] [TeacherDashboard.tsx](file:///c:/aquila/aquilapro_electron/src/ui/pages/TeacherDashboard.tsx)
- View dedicada para o professor logado.
- Exibição de "Aula Atual" baseada no horário.
- Listagem de alunos presentes com indicador de "Tempo em Sala" (ProgressBar).
- Botão "Capturar Conteúdo" para upload de foto do quadro.

### [Component: Management Intelligence]
#### [NEW] [SchoolClimateService.ts](file:///c:/aquila/aquilapro_electron/src/services/SchoolClimateService.ts)
- Engine de agregação de eventos de IA (Crowding, Loitering, Punctuality).
- Geração de métricas anônimas por zonas (Corredores, Pátio, Entrada).

#### [NEW] [ClimateReportPanel.tsx](file:///c:/aquila/aquilapro_electron/src/ui/components/ClimateReportPanel.tsx)
- Visualização de "Mapas de Calor de Eventos".
- Gráficos de eficiência de portaria e fluxo de alunos.

## Verification Plan

### Automated Tests
- Validar se o `SchoolClimateService` retorna apenas dados agregados (sem IDs individuais).
- Testar o renderizador de PDF para os relatórios semanais.

### Manual Verification
- O coordenador pedagógico deve conseguir visualizar o relatório "Mapa de Calor de Uso" e identificar gargalos de fluxo.
