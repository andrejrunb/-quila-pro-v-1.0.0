# Phase 1606: Digital Sovereignty & RuView Expansion

Esta fase executa os próximos passos críticos do roadmap de 100 ações, focando na integração profunda do RuView WiFi, segurança de dados em repouso e preparação para o ecossistema multi-unidade.

## User Review Required

> [!IMPORTANT]
> A criptografia de banco de dados (`Local Hardening`) pode exigir a reinstalação de dependências nativas (sqlcipher). Usaremos uma camada de abstração para não quebrar o ambiente atual.

## Proposed Changes

### 📡 RuView & 3D Intelligence
#### [MODIFY] [UnifiedCommand.tsx](file:///c:/aquila/aquilapro_electron/src/ui/pages/UnifiedCommand.tsx)
- Adicionar modal de "WiFi Density Mapping" para visualização 3D de sinais.
#### [NEW] [WiFiSignalEngine.py](file:///c:/aquila/aquilapro_electron/python/wifi_signal_engine.py)
- Simulador de triangulação de sinais para representação de "presença invisível".

### ☁️ Cloud Sync & Governance
#### [MODIFY] [SyncService.ts](file:///c:/aquila/aquilapro_electron/src/services/SyncService.ts)
- Implementar sincronização segura (HTTPS + HMAC) de logs de auditoria e metadados de incidentes.
#### [MODIFY] [main.ts](file:///c:/aquila/aquilapro_electron/src/main.ts)
- Registrar novos IPC handlers para status de sincronização global.

### 🛡️ Hardening & Mobile Foundation
#### [MODIFY] [Database.ts](file:///c:/aquila/aquilapro_electron/src/database/Database.ts)
- Implementar hooks de criptografia (at-rest) para campos sensíveis (identidade de alunos).
#### [NEW] [MobileGateway.ts](file:///c:/aquila/aquilapro_electron/src/services/MobileGateway.ts)
- Serviço de orquestração de Push Notifications (Firebase/OneSignal setup) e Auth Mobile.

## Verification Plan

### Automated Tests
- Validar integridade do HMAC no `SyncService`.
- Testar descriptografia de campos sensíveis no `Database`.

### Manual Verification
- Visualizar o novo mapa 3DRuView no Eagle Eye Command.
- Verificar logs de sincronização no console do Main Process.
