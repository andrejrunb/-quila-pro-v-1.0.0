# Implementation Plan - v1609: Autonomous Response & IoT Hardening

Esta fase transforma o Áquila Pro de um sistema de monitoramento em um sistema de **resposta ativa**, automatizando gatilhos de segurança física baseados em lógica de rádio e visão.

## Proposed Changes

### [Response Engine]
- [NEW] [AutonomousActionService.ts](file:///c:/aquila/aquilapro_electron/src/services/AutonomousActionService.ts): Motor de regras (IF/THEN) para gatilhos automáticos.
- [MODIFY] [IoTManager.ts](file:///c:/aquila/aquilapro_electron/src/services/IoTManager.ts): Adicionar suporte a "Fast-Path Execution" para comandos de travamento de emergência com baixa latência.

### [Data Hardening]
- [MODIFY] [Database.ts](file:///c:/aquila/aquilapro_electron/src/database/Database.ts): Implementar criptografia de disco transparente (TDE) simulada com **AES-256** para tabelas de alunos e logs forenses.

### [UI / UX]
- [NEW] [ActionPolicyEditor.tsx](file:///c:/aquila/aquilapro_electron/src/ui/components/ActionPolicyEditor.tsx): Interface para o administrador definir regras (ex: "Se arma detectada + Subject a < 2m da Porta Principal -> LOCK").
- [MODIFY] [UnifiedCommand.tsx](file:///c:/aquila/aquilapro_electron/src/ui/pages/UnifiedCommand.tsx): Adicionar indicadores de "Automação Ativa" e status dos atuadores IoT.

## Verification Plan
### Automated Tests
- Simular um evento `CRITICAL_INTRUSION` e verificar se o `IoTManager` recebe o comando `LOCK_ALL` em menos de 50ms.
### Manual Verification
- O usuário ativa a regra de "Porta Automática", simula uma aproximação no modo Site Survey e observa o ícone da porta mudar para "LOCKED" automaticamente.
