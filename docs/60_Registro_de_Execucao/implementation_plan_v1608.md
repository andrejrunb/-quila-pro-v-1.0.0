# Implementation Plan - v1608: Forensic Suite & Incident Replay

Esta fase implementa as capacidades forenses do Áquila Pro, permitindo a reconstrução de incidentes passados usando os dados de sinal do RuView.

## Proposed Changes

### [Forensic Engine]
- [NEW] [IncidentReplayService.ts](file:///c:/aquila/aquilapro_electron/src/services/IncidentReplayService.ts): Serviço para buscar e processar snapshots de sinais WiFi e eventos de rádio.
- [MODIFY] [Database.ts](file:///c:/aquila/aquilapro_electron/src/database/Database.ts): Adicionar índices de tempo otimizados para `signal_history` e `poi_logs`.

### [Frontend Dashboard]
- [NEW] [ReplayConsole.tsx](file:///c:/aquila/aquilapro_electron/src/ui/components/ReplayConsole.tsx): Interface com controles de VCR (Play/Pause/Scrub) para retroceder o mapa 3D.
- [MODIFY] [UnifiedCommand.tsx](file:///c:/aquila/aquilapro_electron/src/ui/pages/UnifiedCommand.tsx): Adicionar aba "Forensics" e integração com a linha do tempo de incidentes.

### [Reporting]
- [NEW] [ForensicExportService.ts](file:///c:/aquila/aquilapro_electron/src/services/ForensicExportService.ts): Gerador de relatórios assinados (PDF) contendo o caminho do sujeito e horários dos POIs (portas) atravessados.

## Verification Plan
### Automated Tests
- Simular um incidente às 10:00 e verificar se o `IncidentReplayService` reconstrói o caminho exatamente igual ao cache original.
### Manual Verification
- O administrador clica em um incidente passado, a interface viaja no tempo e exibe o rastro do sujeito sobre o mapa de calor RuView.
